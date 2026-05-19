import { Request, Response } from "express";
import { connectDB } from "../config/db";

type AppUser = {
  userId: number;
  organizationId?: number | null;
  organizationCode?: string | null;
};

const getAppUser = (req: Request) => (req as Request & { appUser?: AppUser }).appUser;

const toTaskResponse = (row: any) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  priority: row.priority,
  status: row.status,
  estimatedHours: row.estimatedHours,
  deadlineAt: row.deadlineAt,
  startedAt: row.startedAt,
  totalSeconds: row.totalSeconds,
  completionReport: row.completionReport,
  blockers: row.blockers,
  submittedAt: row.submittedAt,
  createdAt: row.createdAt,
  organization: {
    id: row.organizationId,
    name: row.organizationName,
    orgCode: row.organizationCode,
  },
  assignedBy: {
    id: row.assignedById,
    name: row.assignedByName,
    email: row.assignedByEmail,
  },
  assignedTo: {
    id: row.assignedToId,
    name: row.assignedToName,
    email: row.assignedToEmail,
    department: row.assignedToDepartment,
  },
  attachments: row.attachments || [],
});

const selectTasksSql = `
  SELECT t.id,
         t.title,
         t.description,
         t.priority,
         t.status,
         t."estimatedHours" AS "estimatedHours",
         t."deadlineAt" AS "deadlineAt",
         t."startedAt" AS "startedAt",
         t."totalSeconds" AS "totalSeconds",
         t."completionReport" AS "completionReport",
         t.blockers,
         t."submittedAt" AS "submittedAt",
         t."createdAt" AS "createdAt",
         o.id AS "organizationId",
         o.name AS "organizationName",
         o."orgCode" AS "organizationCode",
         creator.id AS "assignedById",
         creator.name AS "assignedByName",
         creator.email AS "assignedByEmail",
         assignee.id AS "assignedToId",
         assignee.name AS "assignedToName",
         assignee.email AS "assignedToEmail",
         assignee.department AS "assignedToDepartment",
         COALESCE(
           json_agg(
             json_build_object(
               'id', a.id,
               'originalName', a."originalName",
               'mimeType', a."mimeType",
               'size', a.size,
               'url', CONCAT('/uploads/tasks/', a."fileName")
             )
           ) FILTER (WHERE a.id IS NOT NULL),
           '[]'
         ) AS attachments
  FROM tasks t
  INNER JOIN organizations o ON o.id = t."organizationId"
  INNER JOIN users creator ON creator.id = t."assignedBy"
  INNER JOIN users assignee ON assignee.id = t."assignedTo"
  LEFT JOIN task_attachments a ON a."taskId" = t.id
`;

const taskGroupOrderSql = `
  GROUP BY t.id, o.id, creator.id, assignee.id
  ORDER BY
    CASE t.status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
    CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    t."deadlineAt" ASC NULLS LAST,
    t."createdAt" DESC
`;

export const getTasks = async (req: Request, res: Response) => {
  try {
    const appUser = getAppUser(req);
    if (!appUser?.userId) {
      return res.json([]);
    }

    const pool = await connectDB();
    const result = await pool.query(
      `${selectTasksSql}
       WHERE (t."assignedTo" = $1 OR t."assignedBy" = $1)
         AND EXISTS (
           SELECT 1
           FROM organization_members om
           WHERE om."userId" = $1
             AND om."organizationId" = t."organizationId"
         )
       ${taskGroupOrderSql}`,
      [appUser.userId],
    );

    return res.json(result.rows.map(toTaskResponse));
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const appUser = getAppUser(req);
    if (!appUser?.userId || !appUser.organizationId) {
      return res.status(400).json({ error: "Select an organization before creating tasks." });
    }

    const { title, description, assignedTo, priority, estimatedHours, deadlineAt } = req.body as {
      title?: string;
      description?: string;
      assignedTo?: string;
      priority?: string;
      estimatedHours?: string;
      deadlineAt?: string;
    };

    if (!title?.trim() || !assignedTo) {
      return res.status(400).json({ error: "Task title and assignee are required." });
    }

    const pool = await connectDB();
    const assignee = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
      [Number(assignedTo), appUser.organizationId],
    );

    if (assignee.rows.length === 0) {
      return res.status(404).json({ error: "Selected employee was not found in this organization." });
    }

    const inserted = await pool.query(
      `INSERT INTO tasks (
        "organizationId",
        title,
        description,
        "assignedBy",
        "assignedTo",
        priority,
        "estimatedHours",
        "deadlineAt"
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        appUser.organizationId,
        title.trim(),
        description?.trim() || null,
        appUser.userId,
        Number(assignedTo),
        priority || "medium",
        estimatedHours ? Number(estimatedHours) : null,
        deadlineAt || null,
      ],
    );

    const taskId = inserted.rows[0].id;
    const files = (req.files as Express.Multer.File[] | undefined) || [];
    for (const file of files) {
      await pool.query(
        `INSERT INTO task_attachments ("taskId", "originalName", "fileName", "mimeType", size, path)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [taskId, file.originalname, file.filename, file.mimetype, file.size, file.path],
      );
    }

    const taskResult = await pool.query(
      `${selectTasksSql}
       WHERE t.id = $1
       ${taskGroupOrderSql}`,
      [taskId],
    );

    return res.status(201).json({ task: toTaskResponse(taskResult.rows[0]) });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};

export const startTask = async (req: Request, res: Response) => {
  try {
    const appUser = getAppUser(req);
    const taskId = Number(req.params.id);
    if (!appUser?.userId || !appUser.organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pool = await connectDB();
    const updated = await pool.query(
      `UPDATE tasks
       SET status = 'in_progress',
           "startedAt" = COALESCE("startedAt", NOW()),
           "updatedAt" = NOW()
       WHERE id = $1
         AND "organizationId" = $2
         AND "assignedTo" = $3
         AND status <> 'completed'
       RETURNING id`,
      [taskId, appUser.organizationId, appUser.userId],
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: "Task cannot be started." });
    }

    return res.json({ message: "Task timer started." });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};

export const stopTask = async (req: Request, res: Response) => {
  try {
    const appUser = getAppUser(req);
    const taskId = Number(req.params.id);
    if (!appUser?.userId || !appUser.organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pool = await connectDB();
    const updated = await pool.query(
      `UPDATE tasks
       SET "totalSeconds" = "totalSeconds" + GREATEST(EXTRACT(EPOCH FROM (NOW() - "startedAt"))::int, 0),
           "startedAt" = NULL,
           "updatedAt" = NOW()
       WHERE id = $1
         AND "organizationId" = $2
         AND "assignedTo" = $3
         AND "startedAt" IS NOT NULL
       RETURNING id`,
      [taskId, appUser.organizationId, appUser.userId],
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: "Task timer is not running." });
    }

    return res.json({ message: "Task timer stopped." });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const appUser = getAppUser(req);
    const taskId = Number(req.params.id);
    if (!appUser?.userId || !appUser.organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { completionReport, blockers } = req.body as {
      completionReport?: string;
      blockers?: string;
    };

    if (!completionReport?.trim()) {
      return res.status(400).json({ error: "Completion report is required." });
    }

    const pool = await connectDB();
    const updated = await pool.query(
      `UPDATE tasks
       SET status = 'completed',
           "totalSeconds" = "totalSeconds" + CASE
             WHEN "startedAt" IS NULL THEN 0
             ELSE GREATEST(EXTRACT(EPOCH FROM (NOW() - "startedAt"))::int, 0)
           END,
           "startedAt" = NULL,
           "completionReport" = $1,
           blockers = $2,
           "submittedAt" = NOW(),
           "updatedAt" = NOW()
       WHERE id = $3
         AND "organizationId" = $4
         AND "assignedTo" = $5
       RETURNING id`,
      [completionReport.trim(), blockers?.trim() || null, taskId, appUser.organizationId, appUser.userId],
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: "Task cannot be completed." });
    }

    return res.json({ message: "Task completed." });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};
