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

:MENU
cls
echo ===================================================
echo             INICIALIZADOR DO SISTEMA
echo ===================================================
echo.
echo   Selecione a opção desejada digitando o número:
echo.
echo   [1] Abrir o Sistema (Recomendado)
echo   [2] Limpar Todos os Dados (Apagar tudo)
echo   [3] Fechar esta janela
echo.
echo ===================================================
set /p opcao="Digite a opção (1-3) e aperte ENTER: "

if "%opcao%"=="1" goto ABRIR
if "%opcao%"=="2" goto RESETAR
if "%opcao%"=="3" goto SAIR
goto MENU

:ABRIR
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
pause
goto MENU

:RESETAR
cls
echo ===================================================
echo   AVISO: LIMPEZA DO BANCO DE DADOS
echo ===================================================
echo.
echo Isso apagará todos os gastos e pessoas cadastradas.
echo Esta ação não pode ser desfeita!
echo.
set /p confirm="Deseja continuar? Digite SIM para confirmar: "
if /i "%confirm%"=="SIM" (
    echo.
    echo Limpando dados...
    call npx prisma db push --force-reset >nul 2>&1
    echo.
    echo Pronto! Todos os dados foram apagados.
) else (
    echo.
    echo Cancelado. Seus dados continuam salvos.
)
echo.
pause
goto MENU

:SAIR
exit /b
