const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { ensureAuthenticated } = require('./authRoutes');

router.use(ensureAuthenticated);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for the authenticated user
 *     security:
 *       - googleAuth: []
 *     responses:
 *       200:
 *         description: A list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       500:
 *         description: Server error
 */

router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task for the authenticated user
 *     security:
 *       - googleAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       201:
 *         description: The created task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

router.post(
    '/',
    [
        body('title', 'Title is required').not().isEmpty().trim().escape(),
        body('title', 'Title cannot be longer than 100 characters').isLength({ max: 100 }),
        body('description', 'Description must be a string').optional().isString().trim().escape(),
        body('status', 'Invalid status value').optional().isIn(['To Do', 'In Progress', 'Blocked', 'Done']),
        body('priority', 'Invalid priority value').optional().isIn(['High', 'Medium', 'Low']),
        body('dueDate', 'Invalid due date').optional().isISO8601().toDate(),
        body('category', 'Category must be a string').optional().isString().trim().escape(),
        body('isCompleted', 'isCompleted must be a boolean').optional().isBoolean(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, status, priority, dueDate, category, isCompleted } = req.body;

        try {
            const newTask = new Task({
                title,
                description,
                status,
                priority,
                dueDate,
                createdBy: req.user._id,
                category,
                isCompleted,
            });

            const task = await newTask.save();
            res.status(201).json(task);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a task by ID for the authenticated user
 *     security:
 *       - googleAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the task to get
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The task object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task by ID for the authenticated user
 *     security:
 *       - googleAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the task to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       200:
 *         description: The updated task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

router.put(
    '/:id',
    [
        body('title', 'Title is required').optional().not().isEmpty().trim().escape(),
        body('title', 'Title cannot be longer than 100 characters').optional().isLength({ max: 100 }),
        body('description', 'Description must be a string').optional().isString().trim().escape(),
        body('status', 'Invalid status value').optional().isIn(['To Do', 'In Progress', 'Blocked', 'Done']),
        body('priority', 'Invalid priority value').optional().isIn(['High', 'Medium', 'Low']),
        body('dueDate', 'Invalid due date').optional().isISO8601().toDate(),
        body('category', 'Category must be a string').optional().isString().trim().escape(),
        body('isCompleted', 'isCompleted must be a boolean').optional().isBoolean(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, status, priority, dueDate, category, isCompleted } = req.body;

        try {
            const task = await Task.findOneAndUpdate(
                { _id: req.params.id, createdBy: req.user._id },
                { $set: { title, description, status, priority, dueDate, category, isCompleted } },
                { new: true, runValidators: true }
            );
            if (!task) {
                return res.status(404).json({ msg: 'Task not found' });
            }
            res.json(task);
        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Task not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);
/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task by ID for the authenticated user
 *     security:
 *       - googleAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the task to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;