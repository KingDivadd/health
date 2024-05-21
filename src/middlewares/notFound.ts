import { Request, Response, NextFunction } from "express"

const notFound = (req: Request, res: Response, next: NextFunction): void => {
    res.status(404).json({ err: "Page not found, check url and try again" })
    next()
}

export default notFound