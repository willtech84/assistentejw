// lib/services/notificacoes/agenda_scheduler.dart

import '../../database/database.dart';
import 'notificacao_service.dart';

class AgendaScheduler {
  final AppDatabase db;
  final NotificacaoService notificacao;

  AgendaScheduler(
    this.db,
    this.notificacao,
  );

  Future<void> verificarAgenda() async {
    final hoje = DateTime.now();

    final reunioes = await db.select(db.reunioes).get();

    for (final reuniao in reunioes) {
      final diferenca =
          reuniao.data.difference(hoje).inDays;

      if (diferenca == 1) {
        await notificacao.mostrar(
          id: reuniao.id,
          titulo: "Reunião amanhã",
          mensagem: reuniao.semana,
        );
      }
    }
  }
}
