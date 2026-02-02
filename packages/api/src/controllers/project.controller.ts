import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

// Generate project code
const generateProjectCode = async (organizationId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.project.count({
    where: {
      organizationId,
      code: { startsWith: `COM-${year}` },
    },
  });
  return `COM-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const getProjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, search, status, type, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      organizationId: req.user!.organizationId,
    };

    if (search) {
      where.OR = [
        { code: { contains: String(search), mode: 'insensitive' } },
        { name: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (type) where.type = type;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          company: { select: { id: true, name: true } },
          projectManager: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { phases: true, materials: true, team: true } },
        },
        orderBy: { [String(sortBy)]: sortOrder },
        skip,
        take: Number(limit),
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: req.user!.organizationId },
      include: {
        contact: true,
        company: true,
        projectManager: { select: { id: true, firstName: true, lastName: true, email: true } },
        phases: {
          include: { tasks: { include: { assignee: { select: { id: true, firstName: true, lastName: true } } } } },
          orderBy: { order: 'asc' },
        },
        materials: { include: { product: true } },
        team: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        costs: { orderBy: { date: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) {
      throw new AppError('Commessa non trovata', 404);
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;
    const organizationId = req.user!.organizationId!;

    const code = await generateProjectCode(organizationId);

    const project = await prisma.project.create({
      data: {
        ...data,
        code,
        organizationId,
        projectManagerId: data.projectManagerId || req.user!.id,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        projectManager: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Create default Kanban phases
    const defaultPhases = [
      // Technical phases
      { name: 'Sopralluogo', type: 'TECHNICAL', order: 0, color: '#9CA3AF' },
      { name: 'Progettazione', type: 'TECHNICAL', order: 1, color: '#60A5FA' },
      { name: 'Permessi', type: 'TECHNICAL', order: 2, color: '#A78BFA' },
      // Administrative phases
      { name: 'Preventivo', type: 'ADMINISTRATIVE', order: 0, color: '#9CA3AF' },
      { name: 'Contratto', type: 'ADMINISTRATIVE', order: 1, color: '#60A5FA' },
      { name: 'Fatturazione', type: 'ADMINISTRATIVE', order: 2, color: '#34D399' },
      // Supplier phases
      { name: 'Richiesta Offerte', type: 'SUPPLIER', order: 0, color: '#9CA3AF' },
      { name: 'Ordini', type: 'SUPPLIER', order: 1, color: '#60A5FA' },
      { name: 'Consegne', type: 'SUPPLIER', order: 2, color: '#34D399' },
      // Installation phases
      { name: 'Programmazione', type: 'INSTALLATION', order: 0, color: '#9CA3AF' },
      { name: 'Installazione', type: 'INSTALLATION', order: 1, color: '#FBBF24' },
      { name: 'Collaudo', type: 'INSTALLATION', order: 2, color: '#34D399' },
    ];

    await prisma.projectPhase.createMany({
      data: defaultPhases.map((phase) => ({
        ...phase,
        projectId: project.id,
      })),
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.project.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      throw new AppError('Commessa non trovata', 404);
    }

    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        projectManager: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.project.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      throw new AppError('Commessa non trovata', 404);
    }

    await prisma.project.delete({ where: { id } });

    res.json({ success: true, message: 'Commessa eliminata' });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        status,
        actualEndDate: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// Phases
export const getPhases = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const where: Record<string, unknown> = { projectId: id };
    if (type) where.type = type;

    const phases = await prisma.projectPhase.findMany({
      where,
      include: {
        tasks: {
          include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    res.json({ success: true, data: phases });
  } catch (error) {
    next(error);
  }
};

export const createPhase = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const phase = await prisma.projectPhase.create({
      data: { ...data, projectId: id },
    });

    res.status(201).json({ success: true, data: phase });
  } catch (error) {
    next(error);
  }
};

export const updatePhase = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phaseId } = req.params;
    const data = req.body;

    const phase = await prisma.projectPhase.update({
      where: { id: phaseId },
      data: {
        ...data,
        completedAt: data.status === 'COMPLETED' ? new Date() : null,
      },
    });

    res.json({ success: true, data: phase });
  } catch (error) {
    next(error);
  }
};

export const deletePhase = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phaseId } = req.params;

    await prisma.projectPhase.delete({ where: { id: phaseId } });

    res.json({ success: true, message: 'Fase eliminata' });
  } catch (error) {
    next(error);
  }
};

export const reorderPhases = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phases } = req.body; // [{ id, order }]

    await Promise.all(
      phases.map((p: { id: string; order: number }) =>
        prisma.projectPhase.update({
          where: { id: p.id },
          data: { order: p.order },
        })
      )
    );

    res.json({ success: true, message: 'Ordine aggiornato' });
  } catch (error) {
    next(error);
  }
};

// Phase Tasks
export const getPhaseTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phaseId } = req.params;

    const tasks = await prisma.projectPhaseTask.findMany({
      where: { phaseId },
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

export const createPhaseTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phaseId } = req.params;
    const data = req.body;

    const task = await prisma.projectPhaseTask.create({
      data: { ...data, phaseId },
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const updatePhaseTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId } = req.params;
    const data = req.body;

    const task = await prisma.projectPhaseTask.update({
      where: { id: taskId },
      data: {
        ...data,
        completedAt: data.status === 'COMPLETED' ? new Date() : null,
      },
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
    });

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const deletePhaseTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId } = req.params;

    await prisma.projectPhaseTask.delete({ where: { id: taskId } });

    res.json({ success: true, message: 'Attività eliminata' });
  } catch (error) {
    next(error);
  }
};

// Materials
export const getMaterials = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const materials = await prisma.projectMaterial.findMany({
      where: { projectId: id },
      include: { product: true },
    });

    res.json({ success: true, data: materials });
  } catch (error) {
    next(error);
  }
};

export const addMaterial = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const totalCost = Number(data.quantity) * Number(data.unitCost);

    const material = await prisma.projectMaterial.create({
      data: {
        ...data,
        totalCost,
        projectId: id,
      },
      include: { product: true },
    });

    res.status(201).json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
};

export const updateMaterial = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { materialId } = req.params;
    const data = req.body;

    const totalCost = data.quantity && data.unitCost
      ? Number(data.quantity) * Number(data.unitCost)
      : undefined;

    const material = await prisma.projectMaterial.update({
      where: { id: materialId },
      data: { ...data, totalCost },
      include: { product: true },
    });

    res.json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
};

export const removeMaterial = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { materialId } = req.params;

    await prisma.projectMaterial.delete({ where: { id: materialId } });

    res.json({ success: true, message: 'Materiale rimosso' });
  } catch (error) {
    next(error);
  }
};

// Costs
export const getCosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const costs = await prisma.projectCost.findMany({
      where: { projectId: id },
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: costs });
  } catch (error) {
    next(error);
  }
};

export const addCost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const cost = await prisma.projectCost.create({
      data: { ...data, projectId: id },
      include: { supplier: { select: { id: true, name: true } } },
    });

    res.status(201).json({ success: true, data: cost });
  } catch (error) {
    next(error);
  }
};

export const updateCost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { costId } = req.params;
    const data = req.body;

    const cost = await prisma.projectCost.update({
      where: { id: costId },
      data,
      include: { supplier: { select: { id: true, name: true } } },
    });

    res.json({ success: true, data: cost });
  } catch (error) {
    next(error);
  }
};

export const removeCost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { costId } = req.params;

    await prisma.projectCost.delete({ where: { id: costId } });

    res.json({ success: true, message: 'Costo rimosso' });
  } catch (error) {
    next(error);
  }
};

export const getCostSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const costs = await prisma.projectCost.groupBy({
      by: ['category'],
      where: { projectId: id },
      _sum: { amount: true },
    });

    const materials = await prisma.projectMaterial.aggregate({
      where: { projectId: id },
      _sum: { totalCost: true },
    });

    const workLogs = await prisma.projectWorkLog.findMany({
      where: { projectId: id },
      include: { teamMember: true },
    });

    const laborCost = workLogs.reduce((acc, log) => {
      const hourlyRate = Number(log.teamMember.hourlyRate) || 0;
      return acc + (Number(log.hours) * hourlyRate);
    }, 0);

    res.json({
      success: true,
      data: {
        byCategory: costs,
        materialsCost: materials._sum.totalCost || 0,
        laborCost,
        totalCost: costs.reduce((acc, c) => acc + Number(c._sum.amount || 0), 0) + Number(materials._sum.totalCost || 0) + laborCost,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Team
export const getTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const team = await prisma.projectTeamMember.findMany({
      where: { projectId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        _count: { select: { workLogs: true } },
      },
    });

    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

export const addTeamMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const member = await prisma.projectTeamMember.create({
      data: { ...data, projectId: id },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

export const updateTeamMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const data = req.body;

    const member = await prisma.projectTeamMember.update({
      where: { id: memberId },
      data,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

export const removeTeamMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId } = req.params;

    await prisma.projectTeamMember.delete({ where: { id: memberId } });

    res.json({ success: true, message: 'Membro rimosso dal team' });
  } catch (error) {
    next(error);
  }
};

// Work Logs
export const getWorkLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const logs = await prisma.projectWorkLog.findMany({
      where: { projectId: id },
      include: {
        teamMember: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export const addWorkLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const log = await prisma.projectWorkLog.create({
      data: { ...data, projectId: id },
      include: {
        teamMember: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    // Update team member actual hours
    await prisma.projectTeamMember.update({
      where: { id: data.teamMemberId },
      data: { actualHours: { increment: Number(data.hours) } },
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

export const updateWorkLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { logId } = req.params;
    const data = req.body;

    const log = await prisma.projectWorkLog.update({
      where: { id: logId },
      data,
    });

    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

export const removeWorkLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { logId } = req.params;

    const log = await prisma.projectWorkLog.findUnique({ where: { id: logId } });
    if (log) {
      await prisma.projectTeamMember.update({
        where: { id: log.teamMemberId },
        data: { actualHours: { decrement: Number(log.hours) } },
      });
    }

    await prisma.projectWorkLog.delete({ where: { id: logId } });

    res.json({ success: true, message: 'Registro ore eliminato' });
  } catch (error) {
    next(error);
  }
};

// Documents
export const getDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const documents = await prisma.projectDocument.findMany({
      where: { projectId: id },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const document = await prisma.projectDocument.create({
      data: {
        ...data,
        projectId: id,
        uploadedById: req.user!.id,
      },
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

export const removeDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { docId } = req.params;

    await prisma.projectDocument.delete({ where: { id: docId } });

    res.json({ success: true, message: 'Documento eliminato' });
  } catch (error) {
    next(error);
  }
};

// Stats
export const getProjectStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        phases: true,
        materials: true,
        costs: true,
        team: { include: { workLogs: true } },
      },
    });

    if (!project) {
      throw new AppError('Commessa non trovata', 404);
    }

    const completedPhases = project.phases.filter(p => p.status === 'COMPLETED').length;
    const totalMaterialCost = project.materials.reduce((acc, m) => acc + Number(m.totalCost), 0);
    const totalOtherCosts = project.costs.reduce((acc, c) => acc + Number(c.amount), 0);
    const totalHours = project.team.reduce((acc, t) =>
      acc + t.workLogs.reduce((h, l) => h + Number(l.hours), 0), 0
    );

    res.json({
      success: true,
      data: {
        progress: project.phases.length > 0 ? (completedPhases / project.phases.length) * 100 : 0,
        phasesTotal: project.phases.length,
        phasesCompleted: completedPhases,
        materialsCost: totalMaterialCost,
        otherCosts: totalOtherCosts,
        totalCost: totalMaterialCost + totalOtherCosts,
        estimatedValue: project.estimatedValue,
        margin: project.estimatedValue ? Number(project.estimatedValue) - (totalMaterialCost + totalOtherCosts) : null,
        totalHours,
        teamSize: project.team.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTimeline = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Combine various events into a timeline
    const [phases, costs, workLogs, documents] = await Promise.all([
      prisma.projectPhase.findMany({
        where: { projectId: id },
        select: { id: true, name: true, status: true, createdAt: true, completedAt: true },
      }),
      prisma.projectCost.findMany({
        where: { projectId: id },
        select: { id: true, description: true, amount: true, date: true, category: true },
      }),
      prisma.projectWorkLog.findMany({
        where: { projectId: id },
        select: { id: true, date: true, hours: true, description: true },
      }),
      prisma.projectDocument.findMany({
        where: { projectId: id },
        select: { id: true, name: true, type: true, createdAt: true },
      }),
    ]);

    const timeline = [
      ...phases.map(p => ({ type: 'phase', data: p, date: p.completedAt || p.createdAt })),
      ...costs.map(c => ({ type: 'cost', data: c, date: c.date })),
      ...workLogs.map(w => ({ type: 'worklog', data: w, date: w.date })),
      ...documents.map(d => ({ type: 'document', data: d, date: d.createdAt })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ success: true, data: timeline });
  } catch (error) {
    next(error);
  }
};
