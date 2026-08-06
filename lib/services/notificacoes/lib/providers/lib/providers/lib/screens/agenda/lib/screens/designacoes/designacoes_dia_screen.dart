// lib/screens/designacoes/designacoes_dia_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/agenda_provider.dart';

class DesignacoesDiaScreen extends ConsumerWidget {
  final DateTime data;

  const DesignacoesDiaScreen({
    super.key,
    required this.data,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agenda = ref.watch(agendaProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Designações"),
      ),
      body: FutureBuilder(
        future: agenda.listarDesignacoes(data),
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
                leading: const Icon(Icons.assignment),
                title: Text(item.estudante),
                subtitle: Text(item.nome),
                trailing: Icon(
                  item.whatsappEnviado
                      ? Icons.check_circle
                      : Icons.schedule,
                ),
              );
            },
          );
        },
      ),
    );
  }
}
