// lib/services/agenda/agenda_service.dart

import '../../database/database.dart';

class AgendaService {
  final AppDatabase db;

  AgendaService(this.db);

  Future<List<Reuniao>> listarReunioes() async {
    return (db.select(db.reunioes)
          ..orderBy([(t) => OrderingTerm.asc(t.data)]))
        .get();
  }

  Future<List<Designacao>> listarDesignacoes(DateTime data) {
    return (db.select(db.designacoes)
          ..where((t) => t.dataReuniao.equals(data))
          ..orderBy([(t) => OrderingTerm.asc(t.nome)]))
        .get();
  }
}
