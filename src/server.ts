import "dotenv/config";
import type { Request, Response } from "express"
import express from "express"
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

const port = 3000
const app = express()

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma }

app.get("/movies", async (req: Request, res: Response) => {
    const movies = await prisma.movie.findMany()
    res.json(movies)
})

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`)
})

