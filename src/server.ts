import "dotenv/config"
import type { Request, Response } from "express"
import express from "express"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

const port = 3000
const app = express()

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

app.use(express.json())

export { prisma }

app.get("/movies", async (req: Request, res: Response) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true,
        },
    })
    res.json(movies)
})

app.post("/movies", async (req: Request, res: Response) => {
    const { title, genre_id, language_id, oscar_count, release_date } = req.body
    try {

        // Verificar no banco se já existe um filme com i nome que está sendo enviado
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: {
                title: {
                    equals: title,
                    mode: "insensitive",
                },
            },
        })

        if (movieWithSameTitle) {
            return res.status(409).send({ message: "Já existe um filme com esse nome" })
        }

        await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date),
            },
        })
    } catch (err) {
        return res.status(500).send({ message: "Erro ao cadastrar filme" })
    }
    res.status(201).send()
})

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`)
})
