// lib/database/tables/pdfs_recebidos.dart

import 'package:drift/drift.dart';

class PdfsRecebidos extends Table {
  IntColumn get id => integer().autoIncrement()();

  TextColumn get nomeArquivo =>
      text().withDefault(const Constant(''))();

  TextColumn get caminhoArquivo =>
      text().withDefault(const Constant(''))();

  TextColumn get estudante =>
      text().withDefault(const Constant(''))();

  TextColumn get telefone =>
      text().withDefault(const Constant(''))();

  BoolColumn get processado =>
      boolean().withDefault(const Constant(false))();

  BoolColumn get enviadoWhatsapp =>
      boolean().withDefault(const Constant(false))();

  DateTimeColumn get recebidoEm =>
      dateTime().withDefault(currentDateAndTime)();
}
