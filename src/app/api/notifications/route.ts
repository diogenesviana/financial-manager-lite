import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeListNotifications, makeMarkNotificationsRead } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const listNotifications = makeListNotifications();
    const notifications = await listNotifications.execute(user.id);

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, readAll } = body;

    const markNotificationsRead = makeMarkNotificationsRead();
    if (readAll) {
      await markNotificationsRead.execute(user.id, { readAll: true });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 });
    }

    await markNotificationsRead.execute(user.id, { id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao atualizar notificação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
