import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeUploadInvoice } from '@/core/factories';

import 'pdfjs-dist/legacy/build/pdf.worker.mjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let password = '';
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const month = (formData.get('month') as string) || '';
    password = (formData.get('password') as string) || '';
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const buffer = Buffer.from(await file.arrayBuffer());
    
    let text = '';
    const pdfStart = performance.now();

    if (isCsv) {
      text = buffer.toString('utf8');
      const parseDuration = ((performance.now() - pdfStart) / 1000).toFixed(2);
      console.log(`[Upload Timer] Leitura do CSV nativa levou: ${parseDuration}s`);
    } else {
      if (typeof (global as any).DOMMatrix === 'undefined') {
        (global as any).DOMMatrix = class DOMMatrix {
          constructor() {}
        };
      }
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer, password });
      const data = await parser.getText();
      text = data.text;
      const pdfDuration = ((performance.now() - pdfStart) / 1000).toFixed(2);
      console.log(`[Upload Timer] Extração de texto do PDF levou: ${pdfDuration}s`);
    }

    if (!text || !text.trim()) {
      if (isCsv) {
        return NextResponse.json({ error: 'Não foi possível extrair texto do arquivo' }, { status: 400 });
      }
      text = '';
    }

    if (!month) {
      return NextResponse.json({ error: 'Mês de referência é obrigatório' }, { status: 400 });
    }

    const dbStart = performance.now();
    const uploadInvoice = makeUploadInvoice();
    const result = await uploadInvoice.execute(user.id, {
      text,
      month,
      isCsv,
      buffer
    });

    const dbDuration = ((performance.now() - dbStart) / 1000).toFixed(2);
    console.log(`[Upload Timer] Processamento de banco de dados levou: ${dbDuration}s`);

    if (result.expensesCount > 0) {
      const dupInfo = result.skippedDuplicates > 0 ? ` (${result.skippedDuplicates} duplicadas ignoradas)` : '';
      return NextResponse.json({ 
        success: true, 
        count: result.expensesCount,
        autoAssigned: result.autoAssigned,
        month: result.month,
        message: `${result.expensesCount} despesas extraídas${dupInfo}. ${result.autoAssigned > 0 ? `${result.autoAssigned} atribuída(s) automaticamente.` : ''}` 
      });
    }

    const dupInfo = result.skippedDuplicates > 0 ? ` (${result.skippedDuplicates} duplicadas ignoradas)` : '';
    return NextResponse.json({ 
      success: true, 
      count: 0,
      month: result.month,
      message: `Nenhuma nova despesa extraída${dupInfo}.` 
    });
  } catch (error: any) {
    console.error('Erro ao processar PDF:', error);
    
    const isPasswordError = 
      error.name === 'PasswordException' || 
      error.message?.toLowerCase().includes('password') ||
      error.message?.toLowerCase().includes('senha') ||
      error.message?.toLowerCase().includes('decrypt') ||
      error.message?.toLowerCase().includes('encrypted');
      
    if (isPasswordError) {
      if (password) {
        return NextResponse.json({ 
          error: 'Senha incorreta. Por favor, tente novamente.', 
          code: 'WRONG_PASSWORD'
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: 'Este arquivo PDF está protegido por senha.', 
        code: 'PASSWORD_REQUIRED'
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro ao processar PDF: ' + error.message }, { status: 500 });
  }
}
