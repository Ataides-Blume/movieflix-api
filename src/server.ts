import "dotenv/config"
import type { Request, Response } from "express"
import express from "express"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"
import swaggerUi from "swagger-ui-express"
import swaggerDocument from "../swagger.json"

const port = 3000
const app = express()

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

app.use(express.json())
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

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
        // Verificar no banco se já existe um filme com id nome que está sendo enviado
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: {
                title: {
                    equals: title,
                    mode: "insensitive",
                },
            },
        })

        if (movieWithSameTitle) {
            return res
                .status(409)
                .send({ message: "Já existe um filme com esse nome" })
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

app.put("/movies/:id", async (req: Request, res: Response) => {
    // pegar o id do registro quer vai ser atualizado
    const id = Number(req.params.id)

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id,
            },
        })

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" })
        }

        const data = { ...req.body }
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined
        // os dados do filme que será atualizado e atualizar ele no prisma
        await prisma.movie.update({
            where: {
                id,
            },
            data: data,
        })
    } catch (err) {
        return res.status(500).send({ message: "Erro ao atualizar filme" })
    }
    // retornar o status correto informando que o filme foi atualizado
    res.status(200).send()
})

app.delete("/movies/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    try {
        const movie = await prisma.movie.findUnique({ where: { id } })

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" })
        }

        await prisma.movie.delete({ where: { id } })
    } catch (err) {
        return res.status(500).send({ message: "Erro ao deletar filme" })
    }

    res.status(200).send()
})

app.get("/movies/:genreName", async (req: Request, res: Response) => {
    try {
        const moviesFilteredByGenreName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true,
            },

            where: {
                genres: {
                    name: {
                        equals: req.params.genreName!,
                        mode: "insensitive",
                    },
                },
            },
        })
        res.status(200).send(moviesFilteredByGenreName)
    } catch (err) {
        return res
            .status(500)
            .send({ message: "Erro ao filtrar filmes por gênero" })
    }
})

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`)
})
