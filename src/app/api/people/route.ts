import { NextResponse } from 'next/server';
import { makeListPeople, makeCreatePerson } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    const listPeople = makeListPeople();
    const mapped = await listPeople.execute(userId, month);

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('Erro ao buscar pessoas:', error);
    return NextResponse.json({ error: 'Erro ao buscar pessoas: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const userEmail = request.headers.get('x-user-email')!;
    const body = await request.json();

    const createPerson = makeCreatePerson();
    const person = await createPerson.execute({
      userId,
      userEmail,
      name: body.name,
      phone: body.phone,
      inviteEmail: body.inviteEmail,
      isSystemUser: body.isSystemUser
    });

    return NextResponse.json(person);
  } catch (error: any) {
    console.error('Erro ao criar pessoa:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
