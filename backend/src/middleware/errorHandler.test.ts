import { describe, expect, it, vi } from 'vitest'
import { AppError, errorHandler } from './errorHandler.js'
import { ValidationError } from '../utils/validation.js'
import type { Request, Response } from 'express'

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }
  return res as unknown as Response & { statusCode: number; body: unknown }
}

describe('errorHandler', () => {
  it('maps ValidationError to 400', () => {
    const res = mockRes()
    errorHandler(
      new ValidationError(['email is required']),
      {} as Request,
      res,
      vi.fn(),
    )
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'email is required',
      details: ['email is required'],
    })
  })

  it('maps AppError with custom code', () => {
    const res = mockRes()
    errorHandler(
      new AppError(404, 'Pass not found', 'PASS_NOT_FOUND'),
      {} as Request,
      res,
      vi.fn(),
    )
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      success: false,
      error: 'PASS_NOT_FOUND',
      message: 'Pass not found',
    })
  })

  it('maps unknown errors to 500', () => {
    const res = mockRes()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    errorHandler(new Error('boom'), {} as Request, res, vi.fn())
    expect(res.statusCode).toBe(500)
    expect(res.body).toMatchObject({
      success: false,
      error: 'INTERNAL_ERROR',
    })
    spy.mockRestore()
  })
})
