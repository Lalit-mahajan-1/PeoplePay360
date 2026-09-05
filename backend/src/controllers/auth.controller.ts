import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { createAuditLog } from '../services/audit.service';

const generateToken = (user: { id: string; email: string; role: string }) => {
  const secret = process.env.JWT_SECRET || 'peoplepay360-super-secret-key-2024';
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, employeeId } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'User already exists with this email' });
      return;
    }

    if (employeeId) {
      const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
      if (!employee) {
        res.status(400).json({ success: false, message: 'Employee not found' });
        return;
      }
      const linkedUser = await prisma.user.findUnique({ where: { employeeId } });
      if (linkedUser) {
        res.status(409).json({ success: false, message: 'Employee already has a user account' });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || 'EMPLOYEE',
        employeeId: employeeId || null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        employeeId: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        createdAt: true,
      },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    await createAuditLog({
      action: 'REGISTER',
      module: 'AUTH',
      recordId: user.id,
      details: `New user registered: ${user.email} (${user.role})`,
      userId: user.id,
    });

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true },
        },
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is deactivated' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    await createAuditLog({
      action: 'LOGIN',
      module: 'AUTH',
      recordId: user.id,
      details: `User logged in: ${user.email}`,
      userId: user.id,
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        employeeId: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            avatarUrl: true,
            department: { select: { id: true, name: true } },
            jobPosition: true,
          },
        },
        createdAt: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};