USE TimesheetDB;

CREATE TABLE Timesheets (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255),
    description NVARCHAR(500),
    createdAt DATETIME DEFAULT GETDATE()
);