// lib/repositories/designacoes_repository.dart

import 'package:drift/drift.dart';

import '../database/database.dart';

class DesignacoesRepository {
  final AppDatabase db;

  DesignacoesRepository(this.db);

  Future<List<Designacao>> listar() {
    return (db.select(db.designacoes)
          ..orderBy([
            (t) => OrderingTerm.asc(t.dataReuniao),
          ]))
        .get();
  }

  Future<Designacao?> obter(int id) {
    return (db.select(db.designacoes)
          ..where((t) => t.id.equals(id)))
        .getSingleOrNull();
  }

  Future<int> inserir(DesignacoesCompanion item) {
    return db.into(db.designacoes).insert(item);
  }

  Future<bool> atualizar(Designacao item) {
    return db.update(db.designacoes).replace(item);
  }

  Future<int> excluir(int id) {
    return (db.delete(db.designacoes)
          ..where((t) => t.id.equals(id)))
        .go();
  }

  Future<void> limpar() async {
    await db.delete(db.designacoes).go();
  }
}
