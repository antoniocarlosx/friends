'use strict' // Trava o JavaScript para evitar erros bobos e variáveis soltas[cite: 11]

// -----------------------------------------------------------------------------
// 1. FERRAMENTAS QUE O SERVIDOR PRECISA USAR (PACOTES)
// -----------------------------------------------------------------------------

const express = require('express')       // Cria as rotas e cuida dos pedidos da internet[cite: 11]
const httpErrors = require('http-errors') // Cria mensagens de erro prontas (exemplo: erro 404)[cite: 11]
const pino = require('pino')             // Escreve avisos e anotações no terminal (logs)[cite: 11]
const pinoHttp = require('pino-http')     // Liga as anotações do Pino em cada clique ou pedido[cite: 11]


// -----------------------------------------------------------------------------
// 2. A FÁBRICA DO SERVIDOR (A FUNÇÃO QUE MONTA TUDO)
// -----------------------------------------------------------------------------

module.exports = function main (options, cb) {

  // Se ninguém mandar uma função de aviso (cb), cria uma vazia para não quebrar[cite: 11]
  const ready = cb || function () {}

  // "opts" é uma caixa com as configurações (guarda a porta e o endereço)[cite: 5, 11]
  const opts = Object.assign({
    // Opções padrão entram aqui[cite: 11]
  }, options)

  // Inicia o caderno de anotações (logger)[cite: 11]
  const logger = pino()


  // ---------------------------------------------------------------------------
  // 3. BOTÕES DE CONTROLE DO SERVIDOR
  // ---------------------------------------------------------------------------

  let server               // Guarda o servidor que vai ligar[cite: 11]
  let serverStarted = false // Diz se o servidor já está funcionando ou não[cite: 11]
  let serverClosing = false // Diz se o servidor está no meio do processo de desligar[cite: 11]


  // ---------------------------------------------------------------------------
  // 4. PLANO DE EMERGÊNCIA (SE O SERVIDOR QUEBRAR)
  // ---------------------------------------------------------------------------

  function unhandledError (err) {
    // Escreve o erro no terminal[cite: 11]
    logger.error(err)

    // Se já estiver desligando, para por aqui para não repetir[cite: 11]
    if (serverClosing) {
      return
    }
    serverClosing = true

    // Se o servidor estiver ligado, desliga ele com cuidado[cite: 11]
    if (serverStarted) {
      server.close(function () {
        process.exit(1) // Fecha o programa avisando que deu problema[cite: 11]
      })
    }
  }

  // Vigia acidentes graves no código para não travar o computador[cite: 11]
  process.on('uncaughtException', unhandledError)
  process.on('unhandledRejection', unhandledError)


  // ---------------------------------------------------------------------------
  // 5. CRIAÇÃO DO APP EXPRESS
  // ---------------------------------------------------------------------------

  const app = express()


  // ---------------------------------------------------------------------------
  // 6. TRABALHADORES DO MEIO DO CAMINHO (MIDDLEWARES)
  // ---------------------------------------------------------------------------

  // Anota no terminal cada pedido que chega da internet[cite: 11]
  app.use(pinoHttp({ logger }))

  /*
   * PONTO DE ATENÇÃO:
   * É aqui embaixo que vamos colocar duas coisas do laboratório:
   * 1. Ler texto em formato JSON enviado no corpo da requisição[cite: 2]
   * 2. Guardar a sessão do usuário que fez o login[cite: 2]
   */


  // ---------------------------------------------------------------------------
  // 7. CARREGAR AS ROTAS (OS CAMINHOS DO SITE)
  // ---------------------------------------------------------------------------

  // Vai lá no arquivo "routes.js" e liga todos os caminhos no app[cite: 8, 11]
  require('./routes')(app, opts)


  // ---------------------------------------------------------------------------
  // 8. O QUE FAZER SE O CAMINHO NÃO EXISTIR (ERRO 404)
  // ---------------------------------------------------------------------------

  app.use(function fourOhFourHandler (req, res, next) {
    // Se a rota não foi encontrada, avisa que deu erro 404[cite: 11]
    next(httpErrors(404, `Route not found: ${req.url}`))
  })


  // ---------------------------------------------------------------------------
  // 9. RESPOSTA FINAL DE ERRO PARA O USUÁRIO (ERRO 500)
  // ---------------------------------------------------------------------------

  app.use(function fiveHundredHandler (err, req, res, next) {
    // Se for erro interno grave, anota nos logs[cite: 11]
    if (err.status >= 500) {
      logger.error(err)
    }

    // Manda uma resposta bonita em formato JSON avisando qual foi o erro[cite: 11]
    res.status(err.status || 500).json({
      messages: [{
        code: err.code || 'InternalServerError',
        message: err.message
      }]
    })
  })


  // ---------------------------------------------------------------------------
  // 10. LIGAR O SERVIDOR NA TOMADA
  // ---------------------------------------------------------------------------

  // Abre a porta para receber visitas da internet[cite: 11]
  server = app.listen(opts.port, opts.host, function (err) {

    // Se a porta estiver com defeito ou ocupada, avisa que falhou[cite: 11]
    if (err) {
      return ready(err, app, server)
    }

    // Se mandaram desligar antes de abrir, para tudo[cite: 11]
    if (serverClosing) {
      return ready(new Error('Server was closed before it could start'))
    }

    // Marca que deu tudo certo e está ligado[cite: 11]
    serverStarted = true
    const addr = server.address()

    // Mostra a mensagem no terminal avisando onde o servidor está rodando[cite: 11]
    logger.info(`Started at ${opts.host || addr.host || 'localhost'}:${addr.port}`)
    
    // Avisa que a montagem terminou com sucesso[cite: 11]
    ready(err, app, server)
  })
}