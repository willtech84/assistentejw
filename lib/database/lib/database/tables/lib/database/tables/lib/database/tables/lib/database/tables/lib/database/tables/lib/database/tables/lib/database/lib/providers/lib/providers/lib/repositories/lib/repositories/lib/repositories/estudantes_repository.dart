// lib/repositories/estudantes_repository.dart

import 'package:drift/drift.dart';

import '../database/database.dart';

class EstudantesRepository {
  final AppDatabase db;

  EstudantesRepository(this.db);

  Future<List<Estudante>> listar() {
    return (db.select(db.estudantes)
          ..orderBy([
            (t) => OrderingTerm.asc(t.nome),
          ]))
        .get();
  }

  Future<Estudante?> buscarPorNome(String nome) {
    return (db.select(db.estudantes)
          ..where((t) => t.nomePesquisa.equals(nome.toLowerCase())))
        .getSingleOrNull();
  }

  Future<int> inserir(EstudantesCompanion estudante) {
    return db.into(db.estudantes).insert(estudante);
  }

  Future<bool> atualizar(Estudante estudante) {
    return db.update(db.estudantes).replace(estudante);
  }

  Future<int> excluir(int id) {
    return (db.delete(db.estudantes)
          ..where((t) => t.id.equals(id)))
        .go();
  }
}
