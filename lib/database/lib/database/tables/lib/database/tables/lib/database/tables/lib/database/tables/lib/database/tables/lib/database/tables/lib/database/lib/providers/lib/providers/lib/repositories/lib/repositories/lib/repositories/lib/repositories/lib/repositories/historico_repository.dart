// lib/repositories/historico_repository.dart

import 'package:drift/drift.dart';

import '../database/database.dart';

class HistoricoRepository {
  final AppDatabase db;

  HistoricoRepository(this.db);

  Future<List<HistoricoEnvio>> listar() {
    return (db.select(db.historicoEnvios)
          ..orderBy([
            (t) => OrderingTerm.desc(t.enviadoEm),
          ]))
        .get();
  }

  Future<int> inserir(HistoricoEnviosCompanion item) {
    return db.into(db.historicoEnvios).insert(item);
  }

  Future<void> limpar() async {
    await db.delete(db.historicoEnvios).go();
  }
}
