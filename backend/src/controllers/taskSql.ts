export const toTaskResponse = (row: any) => ({
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

export const selectTasksSql = `
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

export const taskGroupOrderSql = `
  GROUP BY t.id, o.id, creator.id, assignee.id
  ORDER BY
    CASE t.status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
    CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    t."deadlineAt" ASC NULLS LAST,
    t."createdAt" DESC
`;
