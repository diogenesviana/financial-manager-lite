@echo off
chcp 65001 >nul
title Financial Manager - Inicializador
color 0b

:: Verificar se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O programa auxiliar Node.js não foi encontrado.
    echo Por favor, instale o Node.js antes de continuar.
    echo Você pode baixá-lo em: https://nodejs.org/
    echo.
    pause
    exit /b
)

cls
echo ===================================================
echo   Iniciando o sistema... Por favor, aguarde.
echo ===================================================
echo.

if not exist node_modules (
    echo Instalando componentes necessários pela primeira vez...
    call npm install >nul 2>&1
)

call npx prisma generate >nul 2>&1
call npx prisma db push >nul 2>&1

echo.
echo Abrindo a página no seu navegador...
start http://localhost:3000

echo.
echo ===================================================
echo   SISTEMA INICIADO COM SUCESSO!
echo   Mantenha esta janela aberta enquanto estiver usando.
echo   Para desligar o sistema, basta fechar esta janela.
echo ===================================================
echo.

call npm run dev
