import 'package:drift/drift.dart';

class Designacoes extends Table {
  IntColumn get id => integer().autoIncrement()();

  TextColumn get codigo =>
      text().withDefault(const Constant(''))();

  TextColumn get nome =>
      text().withDefault(const Constant(''))();

  TextColumn get tipo =>
      text().withDefault(const Constant(''));
  // Presidente, Leitor, Tesouros, Joias, Discurso...

  TextColumn get estudante =>
      text().withDefault(const Constant(''))();

  TextColumn get ajudante =>
      text().withDefault(const Constant(''))();

  DateTimeColumn get dataReuniao => dateTime()();

  TextColumn get semana =>
      text().withDefault(const Constant(''))();

  TextColumn get sala =>
      text().withDefault(const Constant('Principal'))();

  TextColumn get observacoes =>
      text().withDefault(const Constant(''))();

  BoolColumn get concluida =>
      boolean().withDefault(const Constant(false))();

  BoolColumn get pdfEnviado =>
      boolean().withDefault(const Constant(false))();

  BoolColumn get whatsappEnviado =>
      boolean().withDefault(const Constant(false))();

  DateTimeColumn get criadoEm =>
      dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get atualizadoEm =>
      dateTime().withDefault(currentDateAndTime)();
}
