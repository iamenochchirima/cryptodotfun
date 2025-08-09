import { Request, Response } from 'express';

export const getHealth = (req: Request, res: Response) => {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
};

export const getStatus = (req: Request, res: Response) => {
  res.json({
    message: 'CryptoDotFun Express API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
};
