// lib/repositories/pdf_repository.dart

import 'package:drift/drift.dart';

import '../database/database.dart';

class PdfRepository {
  final AppDatabase db;

  PdfRepository(this.db);

  Future<List<PdfsRecebido>> listar() {
    return (db.select(db.pdfsRecebidos)
          ..orderBy([
            (t) => OrderingTerm.desc(t.recebidoEm),
          ]))
        .get();
  }

  Future<int> inserir(PdfsRecebidosCompanion pdf) {
    return db.into(db.pdfsRecebidos).insert(pdf);
  }

  Future<bool> atualizar(PdfsRecebido pdf) {
    return db.update(db.pdfsRecebidos).replace(pdf);
  }
}
