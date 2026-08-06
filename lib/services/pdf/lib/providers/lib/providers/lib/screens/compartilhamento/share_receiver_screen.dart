// lib/screens/compartilhamento/share_receiver_screen.dart

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/pdf_processor_provider.dart';
import '../../providers/share_provider.dart';

class ShareReceiverScreen extends ConsumerStatefulWidget {
  const ShareReceiverScreen({super.key});

  @override
  ConsumerState<ShareReceiverScreen> createState() =>
      _ShareReceiverScreenState();
}

class _ShareReceiverScreenState
    extends ConsumerState<ShareReceiverScreen> {
  @override
  void initState() {
    super.initState();

    ref.read(shareServiceProvider).stream.listen((files) async {
      for (final item in files) {
        await ref
            .read(pdfProcessorProvider)
            .processar(File(item.path));
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("PDF recebido."),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text("Aguardando compartilhamentos..."),
      ),
    );
  }
}
