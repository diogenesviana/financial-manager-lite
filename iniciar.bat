@echo off
chcp 65001 >nul
title Financial Manager v1.0.0 - Painel de Controle
color 0F

:: Verificar se Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ [ERRO] O Node.js não foi encontrado no sistema!
    echo Por favor, faça o download e instale o Node.js LTS em: https://nodejs.org/
    echo.
    pause
    exit /b
)

:MENU
cls
echo =================================================================
echo   📊  FINANCIAL MANAGER - CONTROLE DE GASTOS COMPARTILHADOS
echo =================================================================
echo.
echo   [1] 🚀 Iniciar Sistema (Modo Desenvolvimento)
echo   [2] ⚡ Iniciar Sistema (Modo Produção - Mais rápido/otimizado)
echo   [3] ⚙️  Sincronizar/Atualizar Banco de Dados
echo   [4] ⚠️  Resetar Totalmente o Banco de Dados (Apagar tudo)
echo   [5] ❌ Sair
echo.
echo =================================================================
set /p opcao="👉 Selecione uma opção (1-5): "

if "%opcao%"=="1" goto DEV
if "%opcao%"=="2" goto PROD
if "%opcao%"=="3" goto SYNC
if "%opcao%"=="4" goto RESET
if "%opcao%"=="5" goto SAIR
goto MENU

:DEV
cls
echo =================================================================
echo   🚀 Iniciando em Modo Desenvolvimento...
echo =================================================================
echo.
if not exist node_modules (
    echo 📦 Instalando dependências (isso pode levar alguns minutos)...
    call npm install
)
echo.
echo 🔌 Sincronizando banco de dados local...
call npx prisma generate
call npx prisma db push
echo.
echo 🌐 Abrindo o painel no navegador...
start http://localhost:3000
echo.
echo Servidor ativo. Deixe esta janela aberta.
echo Para fechar o sistema, feche esta janela.
echo =================================================================
echo.
call npm run dev
pause
goto MENU

:PROD
cls
echo =================================================================
echo   ⚡ Iniciando em Modo Produção (Recomendado)...
echo =================================================================
echo.
if not exist node_modules (
    echo 📦 Instalando dependências...
    call npm install
)
echo.
echo 🔌 Sincronizando banco de dados...
call npx prisma generate
call npx prisma db push
echo.
echo 🛠️  Compilando a aplicação para o melhor desempenho...
call npm run build
echo.
echo 🌐 Abrindo o painel no navegador...
start http://localhost:3000
echo.
echo Servidor de produção ativo. Deixe esta janela aberta.
echo =================================================================
echo.
call npm run start
pause
goto MENU

:SYNC
cls
echo =================================================================
echo   ⚙️ Sincronizando Banco de Dados...
echo =================================================================
echo.
call npx prisma generate
call npx prisma db push
echo.
echo Banco de dados atualizado com sucesso!
echo.
pause
goto MENU

:RESET
cls
echo =================================================================
echo   ⚠️  ATENÇÃO: REDEFINIÇÃO TOTAL DO BANCO DE DADOS
echo =================================================================
echo.
echo Isso apagará permanentemente TODAS as pessoas e despesas cadastradas!
echo Esta ação NÃO pode ser desfeita.
echo.
set /p confirm="Tem certeza que deseja apagar tudo? (Digite 'SIM' para confirmar): "
if /i "%confirm%"=="SIM" (
    echo.
    echo Redefinindo banco de dados...
    call npx prisma db push --force-reset
    echo.
    echo Banco de dados redefinido e limpo com sucesso!
) else (
    echo.
    echo Operação cancelada pelo usuário.
)
echo.
pause
goto MENU

:SAIR
cls
echo Obrigado por usar o Financial Manager!
timeout /t 2 >nul
exit /b
