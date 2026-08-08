// lib/utils/string_utils.dart

class StringUtils {
  static String normalizar(String texto) {
    return texto
        .toLowerCase()
        .trim()
        .replaceAll(RegExp(r'\s+'), ' ');
  }
}
