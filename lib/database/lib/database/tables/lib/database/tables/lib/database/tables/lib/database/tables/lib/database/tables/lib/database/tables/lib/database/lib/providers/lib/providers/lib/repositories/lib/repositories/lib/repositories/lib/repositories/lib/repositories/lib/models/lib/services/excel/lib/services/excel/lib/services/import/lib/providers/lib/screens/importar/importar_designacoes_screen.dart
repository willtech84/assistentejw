// lib/screens/importar/importar_designacoes_screen.dart

import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/import_provider.dart';

class ImportarDesignacoesScreen extends ConsumerWidget {
  const ImportarDesignacoesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Importar Meeting Schedule"),
      ),
      body: Center(
        child: FilledButton.icon(
          icon: const Icon(Icons.upload_file),
          label: const Text("Selecionar Excel"),
          onPressed: () async {
            final result = await FilePicker.platform.pickFiles(
              type: FileType.custom,
              allowedExtensions: [
                "xlsx",
                "xls",
              ],
            );

            if (result == null) return;

            final file = File(result.files.single.path!);

            final total = await ref
                .read(importServiceProvider)
                .importar(file);

            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    "$total designações importadas.",
                  ),
                ),
              );
            }
          },
        ),
      ),
    );
  }
}
