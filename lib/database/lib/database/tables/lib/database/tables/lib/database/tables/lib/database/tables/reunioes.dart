// lib/database/tables/reunioes.dart

import 'package:drift/drift.dart';

class Reunioes extends Table {
  IntColumn get id => integer().autoIncrement()();

  DateTimeColumn get data => dateTime()();

  TextColumn get semana =>
      text().withDefault(const Constant(''))();

  TextColumn get tema =>
      text().withDefault(const Constant('Reunião Vida e Ministério Cristão'))();

  TextColumn get presidente =>
      text().withDefault(const Constant(''))();

  TextColumn get leitor =>
      text().withDefault(const Constant(''))();

  TextColumn get oracaoInicial =>
      text().withDefault(const Constant(''))();

  TextColumn get oracaoFinal =>
      text().withDefault(const Constant(''))();

  BoolColumn get importada =>
      boolean().withDefault(const Constant(false))();

  DateTimeColumn get criadoEm =>
      dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get atualizadoEm =>
      dateTime().withDefault(currentDateAndTime)();
}
