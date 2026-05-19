@echo off
title Financial Manager - Iniciar
echo ===================================================
echo   Iniciando o Financial Manager...
echo ===================================================
echo.

:: Verificar se Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O Node.js nao esta instalado!
    echo Por favor, faca o download e instale o Node.js LTS em: https://nodejs.org/
    echo.
    pause
    exit /b
)

:: Verificar se a pasta node_modules existe. Se nao, instala as dependencias
if not exist node_modules (
    echo Instalando as dependencias do projeto...
    echo (Isso pode levar alguns minutos na primeira vez)
    call npm install
)

:: Gerar o cliente de banco de dados
echo Sincronizando banco de dados local...
call npx prisma generate

:: Abrir o navegador automaticamente
echo.
echo Abrindo o aplicativo no seu navegador...
start http://localhost:3000

:: Iniciar o servidor local do Next.js
echo.
echo ===================================================
echo   Servidor iniciado! Deixe esta janela aberta.
echo   Para fechar o sistema, basta fechar esta janela.
echo ===================================================
echo.
call npm run dev
