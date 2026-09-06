import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';

export class UserService {
  async getAllUsers() {
    return prisma.user.findMany({
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
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
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
          },
        },
        createdAt: true,
      },
    });
  }

  async createUser(data: { email: string; password?: string; role: UserRole; employeeId: string | null; isActive: boolean }) {
    const password = data.password || 'default123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        role: data.role,
        employeeId: data.employeeId,
        isActive: data.isActive,
      },
    });
  }

  async updateUser(id: string, data: { email?: string; password?: string; role?: UserRole; employeeId?: string | null; isActive?: boolean }) {
    const updateData: any = {};
    if (data.email) updateData.email = data.email.toLowerCase().trim();
    if (data.role) updateData.role = data.role;
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}

export const userService = new UserService();
