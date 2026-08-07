// lib/screens/historico/historico_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/database_provider.dart';

class HistoricoScreen extends ConsumerWidget {
  const HistoricoScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final db = ref.watch(databaseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Histórico'),
      ),
      body: FutureBuilder(
        future: db.select(db.historicoEnvios).get(),
        builder: (_, snapshot) {
          if (!snapshot.hasData) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final lista = snapshot.data!;

          return ListView.builder(
            itemCount: lista.length,
            itemBuilder: (_, i) {
              final item = lista[i];

              return ListTile(
                leading: Icon(
                  item.sucesso
                      ? Icons.check_circle
                      : Icons.error,
                ),
                title: Text(item.estudante),
                subtitle: Text(item.enviadoEm.toString()),
              );
            },
          );
        },
      ),
    );
  }
}
