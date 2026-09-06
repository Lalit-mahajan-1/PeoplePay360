import { Request, Response } from 'express';
import { userService } from '../services/user.service';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = await userService.getUserById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, employeeId, isActive } = req.body;
    
    if (!email || !role) {
      res.status(400).json({ success: false, message: 'Email and role are required' });
      return;
    }

    const newUser = await userService.createUser({
      email,
      password,
      role,
      employeeId,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    res.status(201).json({ success: true, data: newUser });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'User with this email or employee already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { email, password, role, employeeId, isActive } = req.body;
    
    const updatedUser = await userService.updateUser(id, {
      email,
      password,
      role,
      employeeId,
      isActive,
    });
    
    res.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'User with this email or employee already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await userService.deleteUser(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};
