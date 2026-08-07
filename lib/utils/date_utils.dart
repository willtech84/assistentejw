// lib/utils/date_utils.dart

import 'package:intl/intl.dart';

class DateUtilsBr {
  static final DateFormat _format =
      DateFormat('dd/MM/yyyy');

  static String format(DateTime data) {
    return _format.format(data);
  }
}
