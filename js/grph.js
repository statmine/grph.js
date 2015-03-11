//! moment.js
//! version : 2.7.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "2.7.0",
        // the global-scope this is NOT the global object in Node.js
        globalScope = typeof global !== 'undefined' ? global : this,
        oldGlobalMoment,
        round = Math.round,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for language config files
        languages = {},

        // moment internal properties
        momentProperties = {
            _isAMomentObject: null,
            _i : null,
            _f : null,
            _l : null,
            _strict : null,
            _tzm : null,
            _isUTC : null,
            _offset : null,  // optional. Combine with _isUTC
            _pf : null,
            _lang : null  // optional
        },

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
        parseTokenOrdinal = /\d{1,2}/,

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // default relative time thresholds
        relativeTimeThresholds = {
          s: 45,   //seconds to minutes
          m: 45,   //minutes to hours
          h: 22,   //hours to days
          dd: 25,  //days to month (month == 1)
          dm: 45,  //days to months (months > 1)
          dy: 345  //days to year
        },

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

    // Pick the first defined of two or three arguments. dfl comes from
    // default.
    function dfl(a, b, c) {
        switch (arguments.length) {
            case 2: return a != null ? a : b;
            case 3: return a != null ? a : b != null ? b : c;
            default: throw new Error("Implement me");
        }
    }

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        function printMsg() {
            if (moment.suppressDeprecationWarnings === false &&
                    typeof console !== 'undefined' && console.warn) {
                console.warn("Deprecation warning: " + msg);
            }
        }
        return extend(function () {
            if (firstTime) {
                printMsg();
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        checkOverflow(config);
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }

        if (b.hasOwnProperty("toString")) {
            a.toString = b.toString;
        }

        if (b.hasOwnProperty("valueOf")) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function cloneMoment(m) {
        var result = {}, i;
        for (i in m) {
            if (m.hasOwnProperty(i) && momentProperties.hasOwnProperty(i)) {
                result[i] = m[i];
            }
        }

        return result;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return  Object.prototype.toString.call(input) === '[object Date]' ||
                input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (inputObject.hasOwnProperty(prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment.fn._lang[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment.fn._lang, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0;
            }
        }
        return m._isValid;
    }

    function normalizeLanguage(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function makeAs(input, model) {
        return model._isUTC ? moment(input).zone(model._offset || 0) :
            moment(input).local();
    }

    /************************************
        Languages
    ************************************/


    extend(Language.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment.utc([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Remove a language from the `languages` cache. Mostly useful in tests.
    function unloadLang(key) {
        delete languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        var i = 0, j, lang, next, split,
            get = function (k) {
                if (!languages[k] && hasModule) {
                    try {
                        require('./lang/' + k);
                    } catch (e) { }
                }
                return languages[k];
            };

        if (!key) {
            return moment.fn._lang;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            lang = get(key);
            if (lang) {
                return lang;
            }
            key = [key];
        }

        //pick the language from the array
        //try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        //substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        while (i < key.length) {
            split = normalizeLanguage(key[i]).split('-');
            j = split.length;
            next = normalizeLanguage(key[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                lang = get(split.slice(0, j).join('-'));
                if (lang) {
                    return lang;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return moment.fn._lang;
    }

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {

        if (!m.isValid()) {
            return m.lang().invalidDate();
        }

        format = expandFormat(format, m.lang());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, lang) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return lang.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'Q':
            return parseTokenOneDigit;
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) { return parseTokenOneDigit; }
            /* falls through */
        case 'SS':
            if (strict) { return parseTokenTwoDigits; }
            /* falls through */
        case 'SSS':
            if (strict) { return parseTokenThreeDigits; }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return getLangDefinition(config._l)._meridiemParse;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        case 'Do':
            return parseTokenOrdinal;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), "i"));
            return a;
        }
    }

    function timezoneMinutesFromString(string) {
        string = string || "";
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // QUARTER
        case 'Q':
            if (input != null) {
                datePartArray[MONTH] = (toInt(input) - 1) * 3;
            }
            break;
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = getLangDefinition(config._l).monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        case 'Do' :
            if (input != null) {
                datePartArray[DATE] = toInt(parseInt(input, 10));
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = moment.parseTwoDigitYear(input);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = getLangDefinition(config._l).isPM(input);
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = timezoneMinutesFromString(input);
            break;
        // WEEKDAY - human
        case 'dd':
        case 'ddd':
        case 'dddd':
            a = getLangDefinition(config._l).weekdaysParse(input);
            // if we didn't get a weekday name, mark the date as invalid
            if (a != null) {
                config._w = config._w || {};
                config._w['d'] = a;
            } else {
                config._pf.invalidWeekday = input;
            }
            break;
        // WEEK, WEEK DAY - numeric
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gggg':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = toInt(input);
            }
            break;
        case 'gg':
        case 'GG':
            config._w = config._w || {};
            config._w[token] = moment.parseTwoDigitYear(input);
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, lang;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
            week = dfl(w.W, 1);
            weekday = dfl(w.E, 1);
        } else {
            lang = getLangDefinition(config._l);
            dow = lang._week.dow;
            doy = lang._week.doy;

            weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
            week = dfl(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
        // Apply timezone offset from input. The actual zone can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() + config._tzm);
        }
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {

        if (config._f === moment.ISO_8601) {
            parseISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var lang = getLangDefinition(config._l),
            string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, lang).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // handle am pm
        if (config._isPm && config._a[HOUR] < 12) {
            config._a[HOUR] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[HOUR] === 12) {
            config._a[HOUR] = 0;
        }

        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = extend({}, config);
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function parseISO(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be "T" or undefined
                    config._f = isoDates[i][0] + (match[6] || " ");
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += "Z";
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function makeDateFromString(config) {
        parseISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            moment.createFromInputFallback(config);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromConfig(config);
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, language) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = language.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < relativeTimeThresholds.s  && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < relativeTimeThresholds.h && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= relativeTimeThresholds.dd && ['dd', days] ||
                days <= relativeTimeThresholds.dm && ['M'] ||
                days < relativeTimeThresholds.dy && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = cloneMoment(input);

            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = lang;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
            "moment construction falls back to js Date. This is " +
            "discouraged and will be removed in upcoming major " +
            "release. Please refer to " +
            "https://github.com/moment/moment/issues/1407 for more info.",
            function (config) {
        config._d = new Date(config._i);
    });

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return moment();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    moment.min = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    };

    moment.max = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    };

    // creating with utc
    moment.utc = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = lang;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // constant that refers to the ISO standard
    moment.ISO_8601 = function () {};

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function allows you to set a threshold for relative time strings
    moment.relativeTimeThreshold = function(threshold, limit) {
      if (relativeTimeThresholds[threshold] === undefined) {
        return false;
      }
      relativeTimeThresholds[threshold] = limit;
      return true;
    };

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var r;
        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(normalizeLanguage(key), values);
        } else if (values === null) {
            unloadLang(key);
            key = 'en';
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
        return r._abbr;
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null &&  obj.hasOwnProperty('_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().lang('en').format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {

            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function () {
            return this.zone(0);
        },

        local : function () {
            this.zone(0);
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string' && typeof val === 'string') {
                dur = moment.duration(isNaN(+val) ? +input : +val, isNaN(+val) ? val : input);
            } else if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string' && typeof val === 'string') {
                dur = moment.duration(isNaN(+val) ? +input : +val, isNaN(+val) ? val : input);
            } else if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                output += ((this - moment(this).startOf('month')) -
                        (that - moment(that).startOf('month'))) / diff;
                // same as above but with zones, to negate all dst
                output -= ((this.zone() - moment(this).startOf('month').zone()) -
                        (that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function (time) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're zone'd or not.
            var now = time || moment(),
                sod = makeAs(now, this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.lang());
                return this.add({ d : input - day });
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf: function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            return this.startOf(units).add((units === 'isoWeek' ? 'week' : units), 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = units || 'ms';
            return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
        },

        min: deprecate(
                 "moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548",
                 function (other) {
                     other = moment.apply(null, arguments);
                     return other < this ? this : other;
                 }
         ),

        max: deprecate(
                "moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548",
                function (other) {
                    other = moment.apply(null, arguments);
                    return other > this ? this : other;
                }
        ),

        // keepTime = true means only change the timezone, without affecting
        // the local hour. So 5:31:26 +0300 --[zone(2, true)]--> 5:31:26 +0200
        // It is possible that 5:31:26 doesn't exist int zone +0200, so we
        // adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        zone : function (input, keepTime) {
            var offset = this._offset || 0;
            if (input != null) {
                if (typeof input === "string") {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                this._offset = input;
                this._isUTC = true;
                if (offset !== input) {
                    if (!keepTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                                moment.duration(offset - input, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }
            } else {
                return this._isUTC ? offset : this._d.getTimezoneOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? "UTC" : "";
        },

        zoneName : function () {
            return this._isUTC ? "Coordinated Universal Time" : "";
        },

        parseZone : function () {
            if (this._tzm) {
                this.zone(this._tzm);
            } else if (typeof this._i === 'string') {
                this.zone(this._i);
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).zone();
            }

            return (this.zone() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
            return input == null ? year : this.add("y", (input - year));
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add("y", (input - year));
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
            return input == null ? weekday : this.add("d", input - weekday);
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this._lang._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                this[units](value);
            }
            return this;
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.lang().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
                daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate("dates accessor is deprecated. Use date instead.", makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate("years accessor is deprecated. Use year instead.", makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
        Duration Prototype
    ************************************/


    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);
            data.days = days % 30;

            months += absRound(days / 30);
            data.months = months % 12;

            years = absRound(months / 12);
            data.years = years;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            units = normalizeUnits(units);
            return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
        },

        lang : moment.fn.lang,

        toIsoString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        }
    });

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);
    moment.duration.fn.asMonths = function () {
        return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
    };


    /************************************
        Default Lang
    ************************************/


    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LANGUAGES */

    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    "Accessing Moment through the global scope is " +
                    "deprecated, and will be removed in an upcoming " +
                    "release.",
                    moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === "function" && define.amd) {
        define("moment", function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);

// Generated by CoffeeScript 1.6.2
(function() {
  var deprecate, hasModule, makeTwix,
    __slice = [].slice;

  hasModule = (typeof module !== "undefined" && module !== null) && (module.exports != null);

  deprecate = function(name, instead, fn) {
    var alreadyDone;

    alreadyDone = false;
    return function() {
      var args;

      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (!alreadyDone) {
        if ((typeof console !== "undefined" && console !== null) && (console.warn != null)) {
          console.warn("#" + name + " is deprecated. Use #" + instead + " instead.");
        }
      }
      alreadyDone = true;
      return fn.apply(this, args);
    };
  };

  makeTwix = function(moment) {
    var Twix, getPrototypeOf, languagesLoaded;

    if (moment == null) {
      throw "Can't find moment";
    }
    languagesLoaded = false;
    Twix = (function() {
      function Twix(start, end, parseFormat, options) {
        var _ref;

        if (options == null) {
          options = {};
        }
        if (typeof parseFormat !== "string") {
          options = parseFormat != null ? parseFormat : {};
          parseFormat = null;
        }
        if (typeof options === "boolean") {
          options = {
            allDay: options
          };
        }
        this.start = moment(start, parseFormat, options.parseStrict);
        this.end = moment(end, parseFormat, options.parseStrict);
        this.allDay = (_ref = options.allDay) != null ? _ref : false;
      }

      Twix._extend = function() {
        var attr, first, other, others, _i, _len;

        first = arguments[0], others = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        for (_i = 0, _len = others.length; _i < _len; _i++) {
          other = others[_i];
          for (attr in other) {
            if (typeof other[attr] !== "undefined") {
              first[attr] = other[attr];
            }
          }
        }
        return first;
      };

      Twix.defaults = {
        twentyFourHour: false,
        allDaySimple: {
          fn: function(options) {
            return function() {
              return options.allDay;
            };
          },
          slot: 0,
          pre: " "
        },
        dayOfWeek: {
          fn: function(options) {
            return function(date) {
              return date.format(options.weekdayFormat);
            };
          },
          slot: 1,
          pre: " "
        },
        allDayMonth: {
          fn: function(options) {
            return function(date) {
              return date.format("" + options.monthFormat + " " + options.dayFormat);
            };
          },
          slot: 2,
          pre: " "
        },
        month: {
          fn: function(options) {
            return function(date) {
              return date.format(options.monthFormat);
            };
          },
          slot: 2,
          pre: " "
        },
        date: {
          fn: function(options) {
            return function(date) {
              return date.format(options.dayFormat);
            };
          },
          slot: 3,
          pre: " "
        },
        year: {
          fn: function(options) {
            return function(date) {
              return date.format(options.yearFormat);
            };
          },
          slot: 4,
          pre: ", "
        },
        time: {
          fn: function(options) {
            return function(date) {
              var str;

              str = date.minutes() === 0 && options.implicitMinutes && !options.twentyFourHour ? date.format(options.hourFormat) : date.format("" + options.hourFormat + ":" + options.minuteFormat);
              if (!options.groupMeridiems && !options.twentyFourHour) {
                if (options.spaceBeforeMeridiem) {
                  str += " ";
                }
                str += date.format(options.meridiemFormat);
              }
              return str;
            };
          },
          slot: 5,
          pre: ", "
        },
        meridiem: {
          fn: function(options) {
            var _this = this;

            return function(t) {
              return t.format(options.meridiemFormat);
            };
          },
          slot: 6,
          pre: function(options) {
            if (options.spaceBeforeMeridiem) {
              return " ";
            } else {
              return "";
            }
          }
        }
      };

      Twix.registerLang = function(name, options) {
        return moment.lang(name, {
          twix: Twix._extend({}, Twix.defaults, options)
        });
      };

      Twix.prototype.isSame = function(period) {
        return this.start.isSame(this.end, period);
      };

      Twix.prototype.length = function(period) {
        return this._trueEnd(true).diff(this._trueStart(), period);
      };

      Twix.prototype.count = function(period) {
        var end, start;

        start = this.start.clone().startOf(period);
        end = this.end.clone().startOf(period);
        return end.diff(start, period) + 1;
      };

      Twix.prototype.countInner = function(period) {
        var end, start, _ref;

        _ref = this._inner(period), start = _ref[0], end = _ref[1];
        if (start >= end) {
          return 0;
        }
        return end.diff(start, period);
      };

      Twix.prototype.iterate = function(intervalAmount, period, minHours) {
        var end, hasNext, start, _ref,
          _this = this;

        if (intervalAmount == null) {
          intervalAmount = 1;
        }
        _ref = this._prepIterateInputs(intervalAmount, period, minHours), intervalAmount = _ref[0], period = _ref[1], minHours = _ref[2];
        start = this.start.clone().startOf(period);
        end = this.end.clone().startOf(period);
        hasNext = function() {
          return start <= end && (!minHours || start.valueOf() !== end.valueOf() || _this.end.hours() > minHours || _this.allDay);
        };
        return this._iterateHelper(period, start, hasNext, intervalAmount);
      };

      Twix.prototype.iterateInner = function(intervalAmount, period) {
        var end, hasNext, start, _ref, _ref1;

        if (intervalAmount == null) {
          intervalAmount = 1;
        }
        _ref = this._prepIterateInputs(intervalAmount, period), intervalAmount = _ref[0], period = _ref[1];
        _ref1 = this._inner(period, intervalAmount), start = _ref1[0], end = _ref1[1];
        hasNext = function() {
          return start < end;
        };
        return this._iterateHelper(period, start, hasNext, intervalAmount);
      };

      Twix.prototype.humanizeLength = function() {
        if (this.allDay) {
          if (this.isSame("day")) {
            return "all day";
          } else {
            return this.start.from(this.end.clone().add(1, "day"), true);
          }
        } else {
          return this.start.from(this.end, true);
        }
      };

      Twix.prototype.asDuration = function(units) {
        var diff;

        diff = this.end.diff(this.start);
        return moment.duration(diff);
      };

      Twix.prototype.isPast = function() {
        if (this.allDay) {
          return this.end.clone().endOf("day") < moment();
        } else {
          return this.end < moment();
        }
      };

      Twix.prototype.isFuture = function() {
        if (this.allDay) {
          return this.start.clone().startOf("day") > moment();
        } else {
          return this.start > moment();
        }
      };

      Twix.prototype.isCurrent = function() {
        return !this.isPast() && !this.isFuture();
      };

      Twix.prototype.contains = function(mom) {
        mom = moment(mom);
        return this._trueStart() <= mom && this._trueEnd() >= mom;
      };

      Twix.prototype.isEmpty = function() {
        return this._trueStart().valueOf() === this._trueEnd().valueOf();
      };

      Twix.prototype.overlaps = function(other) {
        return this._trueEnd().isAfter(other._trueStart()) && this._trueStart().isBefore(other._trueEnd());
      };

      Twix.prototype.engulfs = function(other) {
        return this._trueStart() <= other._trueStart() && this._trueEnd() >= other._trueEnd();
      };

      Twix.prototype.union = function(other) {
        var allDay, newEnd, newStart;

        allDay = this.allDay && other.allDay;
        if (allDay) {
          newStart = this.start < other.start ? this.start : other.start;
          newEnd = this.end > other.end ? this.end : other.end;
        } else {
          newStart = this._trueStart() < other._trueStart() ? this._trueStart() : other._trueStart();
          newEnd = this._trueEnd() > other._trueEnd() ? this._trueEnd() : other._trueEnd();
        }
        return new Twix(newStart, newEnd, allDay);
      };

      Twix.prototype.intersection = function(other) {
        var allDay, end, newEnd, newStart;

        newStart = this.start > other.start ? this.start : other.start;
        if (this.allDay) {
          end = moment(this.end);
          end.add(1, "day");
          end.subtract(1, "millisecond");
          if (other.allDay) {
            newEnd = end < other.end ? this.end : other.end;
          } else {
            newEnd = end < other.end ? end : other.end;
          }
        } else {
          newEnd = this.end < other.end ? this.end : other.end;
        }
        allDay = this.allDay && other.allDay;
        return new Twix(newStart, newEnd, allDay);
      };

      Twix.prototype.isValid = function() {
        return this._trueStart() <= this._trueEnd();
      };

      Twix.prototype.equals = function(other) {
        return (other instanceof Twix) && this.allDay === other.allDay && this.start.valueOf() === other.start.valueOf() && this.end.valueOf() === other.end.valueOf();
      };

      Twix.prototype.toString = function() {
        var _ref;

        return "{start: " + (this.start.format()) + ", end: " + (this.end.format()) + ", allDay: " + ((_ref = this.allDay) != null ? _ref : {
          "true": "false"
        }) + "}";
      };

      Twix.prototype.simpleFormat = function(momentOpts, inopts) {
        var options, s;

        options = {
          allDay: "(all day)",
          template: Twix.formatTemplate
        };
        Twix._extend(options, inopts || {});
        s = options.template(this.start.format(momentOpts), this.end.format(momentOpts));
        if (this.allDay && options.allDay) {
          s += " " + options.allDay;
        }
        return s;
      };

      Twix.prototype.format = function(inopts) {
        var common_bucket, end_bucket, fold, format, fs, global_first, goesIntoTheMorning, needDate, options, process, start_bucket, together, _i, _len,
          _this = this;

        this._lazyLang();
        if (this.isEmpty()) {
          return "";
        }
        options = {
          groupMeridiems: true,
          spaceBeforeMeridiem: true,
          showDate: true,
          showDayOfWeek: false,
          twentyFourHour: this.langData.twentyFourHour,
          implicitMinutes: true,
          implicitYear: true,
          yearFormat: "YYYY",
          monthFormat: "MMM",
          weekdayFormat: "ddd",
          dayFormat: "D",
          meridiemFormat: "A",
          hourFormat: "h",
          minuteFormat: "mm",
          allDay: "all day",
          explicitAllDay: false,
          lastNightEndsAt: 0,
          template: Twix.formatTemplate
        };
        Twix._extend(options, inopts || {});
        fs = [];
        if (options.twentyFourHour) {
          options.hourFormat = options.hourFormat.replace("h", "H");
        }
        goesIntoTheMorning = options.lastNightEndsAt > 0 && !this.allDay && this.end.clone().startOf("day").valueOf() === this.start.clone().add(1, "day").startOf("day").valueOf() && this.start.hours() > 12 && this.end.hours() < options.lastNightEndsAt;
        needDate = options.showDate || (!this.isSame("day") && !goesIntoTheMorning);
        if (this.allDay && this.isSame("day") && (!options.showDate || options.explicitAllDay)) {
          fs.push({
            name: "all day simple",
            fn: this._formatFn('allDaySimple', options),
            pre: this._formatPre('allDaySimple', options),
            slot: this._formatSlot('allDaySimple')
          });
        }
        if (needDate && (!options.implicitYear || this.start.year() !== moment().year() || !this.isSame("year"))) {
          fs.push({
            name: "year",
            fn: this._formatFn('year', options),
            pre: this._formatPre('year', options),
            slot: this._formatSlot('year')
          });
        }
        if (!this.allDay && needDate) {
          fs.push({
            name: "all day month",
            fn: this._formatFn('allDayMonth', options),
            ignoreEnd: function() {
              return goesIntoTheMorning;
            },
            pre: this._formatPre('allDayMonth', options),
            slot: this._formatSlot('allDayMonth')
          });
        }
        if (this.allDay && needDate) {
          fs.push({
            name: "month",
            fn: this._formatFn('month', options),
            pre: this._formatPre('month', options),
            slot: this._formatSlot('month')
          });
        }
        if (this.allDay && needDate) {
          fs.push({
            name: "date",
            fn: this._formatFn('date', options),
            pre: this._formatPre('date', options),
            slot: this._formatSlot('date')
          });
        }
        if (needDate && options.showDayOfWeek) {
          fs.push({
            name: "day of week",
            fn: this._formatFn('dayOfWeek', options),
            pre: this._formatPre('dayOfWeek', options),
            slot: this._formatSlot('dayOfWeek')
          });
        }
        if (options.groupMeridiems && !options.twentyFourHour && !this.allDay) {
          fs.push({
            name: "meridiem",
            fn: this._formatFn('meridiem', options),
            pre: this._formatPre('meridiem', options),
            slot: this._formatSlot('meridiem')
          });
        }
        if (!this.allDay) {
          fs.push({
            name: "time",
            fn: this._formatFn('time', options),
            pre: this._formatPre('time', options),
            slot: this._formatSlot('time')
          });
        }
        start_bucket = [];
        end_bucket = [];
        common_bucket = [];
        together = true;
        process = function(format) {
          var end_str, start_group, start_str;

          start_str = format.fn(_this.start);
          end_str = format.ignoreEnd && format.ignoreEnd() ? start_str : format.fn(_this.end);
          start_group = {
            format: format,
            value: function() {
              return start_str;
            }
          };
          if (end_str === start_str && together) {
            return common_bucket.push(start_group);
          } else {
            if (together) {
              together = false;
              common_bucket.push({
                format: {
                  slot: format.slot,
                  pre: ""
                },
                value: function() {
                  return options.template(fold(start_bucket), fold(end_bucket, true).trim());
                }
              });
            }
            start_bucket.push(start_group);
            return end_bucket.push({
              format: format,
              value: function() {
                return end_str;
              }
            });
          }
        };
        for (_i = 0, _len = fs.length; _i < _len; _i++) {
          format = fs[_i];
          process(format);
        }
        global_first = true;
        fold = function(array, skip_pre) {
          var local_first, section, str, _j, _len1, _ref;

          local_first = true;
          str = "";
          _ref = array.sort(function(a, b) {
            return a.format.slot - b.format.slot;
          });
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            section = _ref[_j];
            if (!global_first) {
              if (local_first && skip_pre) {
                str += " ";
              } else {
                str += section.format.pre;
              }
            }
            str += section.value();
            global_first = false;
            local_first = false;
          }
          return str;
        };
        return fold(common_bucket);
      };

      Twix.prototype._trueStart = function() {
        if (this.allDay) {
          return this.start.clone().startOf("day");
        } else {
          return this.start.clone();
        }
      };

      Twix.prototype._trueEnd = function(diffableEnd) {
        if (diffableEnd == null) {
          diffableEnd = false;
        }
        if (this.allDay) {
          if (diffableEnd) {
            return this.end.clone().add(1, "day");
          } else {
            return this.end.clone().endOf("day");
          }
        } else {
          return this.end.clone();
        }
      };

      Twix.prototype._iterateHelper = function(period, iter, hasNext, intervalAmount) {
        var _this = this;

        if (intervalAmount == null) {
          intervalAmount = 1;
        }
        return {
          next: function() {
            var val;

            if (!hasNext()) {
              return null;
            } else {
              val = iter.clone();
              iter.add(intervalAmount, period);
              return val;
            }
          },
          hasNext: hasNext
        };
      };

      Twix.prototype._prepIterateInputs = function() {
        var inputs, intervalAmount, minHours, period, _ref, _ref1;

        inputs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (typeof inputs[0] === 'number') {
          return inputs;
        }
        if (typeof inputs[0] === 'string') {
          period = inputs.shift();
          intervalAmount = (_ref = inputs.pop()) != null ? _ref : 1;
          if (inputs.length) {
            minHours = (_ref1 = inputs[0]) != null ? _ref1 : false;
          }
        }
        if (moment.isDuration(inputs[0])) {
          period = 'milliseconds';
          intervalAmount = inputs[0].as(period);
        }
        return [intervalAmount, period, minHours];
      };

      Twix.prototype._inner = function(period, intervalAmount) {
        var durationCount, durationPeriod, end, modulus, start;

        if (period == null) {
          period = "milliseconds";
        }
        if (intervalAmount == null) {
          intervalAmount = 1;
        }
        start = this._trueStart();
        end = this._trueEnd(true);
        if (start > start.clone().startOf(period)) {
          start.startOf(period).add(intervalAmount, period);
        }
        if (end < end.clone().endOf(period)) {
          end.startOf(period);
        }
        durationPeriod = start.twix(end).asDuration(period);
        durationCount = durationPeriod.get(period);
        modulus = durationCount % intervalAmount;
        end.subtract(modulus, period);
        return [start, end];
      };

      Twix.prototype._lazyLang = function() {
        var e, langData, languages, _ref;

        langData = this.start.lang();
        if ((langData != null) && this.end.lang()._abbr !== langData._abbr) {
          this.end.lang(langData._abbr);
        }
        if ((this.langData != null) && this.langData._abbr === langData._abbr) {
          return;
        }
        if (hasModule && !(languagesLoaded || langData._abbr === "en")) {
          try {
            languages = require("./lang");
            languages(moment, Twix);
          } catch (_error) {
            e = _error;
          }
          languagesLoaded = true;
        }
        return this.langData = (_ref = langData != null ? langData._twix : void 0) != null ? _ref : Twix.defaults;
      };

      Twix.prototype._formatFn = function(name, options) {
        return this.langData[name].fn(options);
      };

      Twix.prototype._formatSlot = function(name) {
        return this.langData[name].slot;
      };

      Twix.prototype._formatPre = function(name, options) {
        if (typeof this.langData[name].pre === "function") {
          return this.langData[name].pre(options);
        } else {
          return this.langData[name].pre;
        }
      };

      Twix.prototype.sameDay = deprecate("sameDay", "isSame('day')", function() {
        return this.isSame("day");
      });

      Twix.prototype.sameYear = deprecate("sameYear", "isSame('year')", function() {
        return this.isSame("year");
      });

      Twix.prototype.countDays = deprecate("countDays", "countOuter('days')", function() {
        return this.countOuter("days");
      });

      Twix.prototype.daysIn = deprecate("daysIn", "iterate('days' [,minHours])", function(minHours) {
        return this.iterate('days', minHours);
      });

      Twix.prototype.past = deprecate("past", "isPast()", function() {
        return this.isPast();
      });

      Twix.prototype.duration = deprecate("duration", "humanizeLength()", function() {
        return this.humanizeLength();
      });

      Twix.prototype.merge = deprecate("merge", "union(other)", function(other) {
        return this.union(other);
      });

      return Twix;

    })();
    getPrototypeOf = function(o) {
      if (typeof Object.getPrototypeOf === "function") {
        return Object.getPrototypeOf(o);
      } else if ("".__proto__ === String.prototype) {
        return o.__proto__;
      } else {
        return o.constructor.prototype;
      }
    };
    Twix._extend(getPrototypeOf(moment.fn._lang), {
      _twix: Twix.defaults
    });
    Twix.formatTemplate = function(leftSide, rightSide) {
      return "" + leftSide + " - " + rightSide;
    };
    moment.twix = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Twix, arguments, function(){});
    };
    moment.fn.twix = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Twix, [this].concat(__slice.call(arguments)), function(){});
    };
    moment.fn.forDuration = function(duration, allDay) {
      return new Twix(this, this.clone().add(duration), allDay);
    };
    moment.duration.fn.afterMoment = function(startingTime, allDay) {
      return new Twix(startingTime, moment(startingTime).clone().add(this), allDay);
    };
    moment.duration.fn.beforeMoment = function(startingTime, allDay) {
      return new Twix(moment(startingTime).clone().subtract(this), startingTime, allDay);
    };
    moment.twixClass = Twix;
    return Twix;
  };

  if (hasModule) {
    module.exports = makeTwix(require("moment"));
  }

  if (typeof define === "function") {
    define("twix", ["moment"], function(moment) {
      return makeTwix(moment);
    });
  }

  if (this.moment != null) {
    this.Twix = makeTwix(this.moment);
  }

}).call(this);

(function() {
  grph = {};


function grph_axis_categorical() {

  var scale = grph_scale_categorical();
  var width;
  var variable, height;

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "axis_categorical dummy")
    .attr("width", 0).attr("height", 0)
    .style("visibility", "hidden");
  var label_size_ = grph_label_size(dummy_);

  function axis(g) {
    var ticks = axis.ticks();
    g.append("rect").attr("class", "background")
      .attr("width", axis.width()).attr("height", axis.height());
    g.selectAll(".tick").data(ticks).enter()
      .append("line").attr("class", "ticks")
      .attr("x1", axis.width() - settings("tick_length"))
      .attr("x2", axis.width())
      .attr("y1", scale.m).attr("y2", scale.m);
    g.selectAll(".ticklabel").data(ticks).enter()
      .append("text").attr("class", "ticklabel")
      .attr("x", axis.width() - settings("tick_length") - settings("tick_padding"))
      .attr("y", scale.m)
      .text(function(d) { return d;})
      .attr("text-anchor", "end")
      .attr("dy", "0.35em");
    g.append("line").attr("class", "axisline")
      .attr("x1", axis.width()).attr("x2", axis.width())
      .attr("y1", 0). attr("y2", axis.height());
  }

  axis.width = function(w) {
    if (arguments.length === 0) {
      var ticks = scale.ticks();
      var max_width = 0;
      for (var i = 0; i < ticks.length; ++i) {
        var lw = label_size_.width(ticks[i]);
        if (lw > max_width) max_width = lw;
      }
      width = max_width + settings("tick_length") + settings("tick_padding");  
      return width;
    } else {
      width = w;
      return this;
    }
  };

  axis.height = function(h) {
    if (arguments.length === 0) {
      return height;
    } else {
      height = h;
      scale.range([0, h]);
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'string' || vschema.type == 'categorical' ||
      vschema.type == 'period';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable;
    } else {
      variable = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale.domain();
    } else {
      var d = data.map(function(d) { return d[variable];});
      // filter out duplicate values
      var domain = d.filter(function(value, index, self) {
        return self.indexOf(value) === index;
      });
      scale.domain(domain);
      return this;
    }
  };

  axis.ticks = function() {
    return scale.ticks();
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return scale(v[variable]).m;
    } else {
      return scale(v).m;
    }
  };

  axis.scale.l = function(v) {
    if (typeof v == 'object') { 
      return scale(v[variable]).l;
    } else {
      return scale(v).l;
    }
  };

  axis.scale.u = function(v) {
    if (typeof v == 'object') { 
      return scale(v[variable]).u;
    } else {
      return scale(v).u;
    }
  };

  axis.scale.w = function(v) {
    var r;
    if (typeof v == 'object') { 
      r = scale(v[variable]);
    } else {
      r = scale(v);
    }
    return r.u - r.l;
  };

  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.categorical = grph_axis_categorical();



function grph_axis_chloropleth() {

  var variable;
  var width, height;
  var scale = grph_scale_chloropleth();

  function axis(g) {
  }

  axis.width = function(w) {
    if (arguments.length === 0) {
      return width;
    } else {
      width = w;
      return this;
    }
  };

  axis.height = function(h) {
    if (arguments.length === 0) {
      return height;
    } else {
      height = h;
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'number';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable;
    } else {
      variable = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale.domain();
    } else {
      if (variable === undefined) return this;
      scale.domain(d3.extent(data, function(d) { return d[variable];}));
      return this;
    }
  };

  axis.ticks = function() {
    return scale.ticks();
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return axis.scale(v[variable]);
    } else {
      return scale(v);
    }
  };

  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.chloropleth = grph_axis_chloropleth();



function grph_axis_colour() {

  var scale = grph_scale_colour();
  var variable_;
  var width_, height_;

  function axis(g) {
  }

  axis.width = function(width) {
    if (arguments.length === 0) {
      return width_;
    } else {
      width_ = width;
      return this;
    }
  };

  axis.height = function(height) {
    if (arguments.length === 0) {
      return height_;
    } else {
      height_ = height;
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == "categorical" || vschema.type == "period";
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale.domain();
    } else {
      if (variable_ === undefined) return this;
      var vschema = variable_schema(variable_, schema);
      var categories = [];
      if (vschema.type == "categorical") {
        categories = vschema.categories.map(function(d) { return d.name; });
      } else {
        var vals = data.map(function(d) { return d[variable_];}).sort();
        var prev;
        for (var i = 0; i < vals.length; ++i) {
          if (vals[i] != prev) categories.push("" + vals[i]);
          prev = vals[i];
        }
      }
      scale.domain(categories);
      return this;
    }
  };

  axis.ticks = function() {
    return scale.ticks();
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return scale(v[variable_]);
    } else {
      return scale(v);
    }
  };

  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.colour = grph_axis_colour();



function grph_axis_linear(horizontal) {

  var scale_ = grph_scale_linear();
  var horizontal_ = horizontal;
  var variable_;
  var width_, height_;
  var origin_;
  var settings_ = {
    "tick_length" : 5,
    "tick_padding" : 2,
    "padding" : 4
  };

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "linearaxis dummy")
    .attr("width", 0).attr("height", 0)
    .style("visibility", "hidden");
  var label_size_ = grph_label_size(dummy_);
  if (horizontal_) scale_.label_size(label_size_.width);
  else scale_.label_size(label_size_.height);
  

  function axis(g) {
    var w = axis.width();
    var ticks = axis.ticks();
    g.append("rect").attr("class", "background")
      .attr("width", w).attr("height", axis.height());
    if (horizontal) {
      g.selectAll(".tick").data(ticks).enter()
        .append("line").attr("class", "tick")
        .attr("x1", scale_).attr("x2", scale_)
        .attr("y1", 0).attr("y2", settings_.tick_length);
      g.selectAll(".ticklabel").data(ticks).enter()
        .append("text").attr("class", "ticklabel")
        .attr("x", scale_).attr("y", settings_.tick_length + settings_.tick_padding)
        .text(function(d) { return d;})
        .attr("text-anchor", "middle")
        .attr("dy", "0.71em");
    } else {
      g.selectAll(".tick").data(ticks).enter()
        .append("line").attr("class", "tick")
        .attr("x1", w-settings_.tick_length).attr("x2", w)
        .attr("y1", scale_).attr("y2", scale_);
      g.selectAll(".ticklabel").data(ticks).enter()
        .append("text").attr("class", "ticklabel")
        .attr("x", settings_.padding).attr("y", scale_)
        .text(function(d) { return d;})
        .attr("text-anchor", "begin")
        .attr("dy", "0.35em");
    }
  }

  axis.width = function(width) {
    if (horizontal_) {
      // if horizontal the width is usually given; this defines the range of
      // the scale
      if (arguments.length === 0) {
        return width_;
      } else {
        width_ = width;
        scale_.range([0, width_]);
        return this;
      }
    } else {
      // if vertical the width is usually defined by the graph: the space it
      // needs to draw the tickmarks and labels etc. 
      if (arguments.length === 0) {
        var ticks = scale_.ticks();
        var w = 0;
        for (var i = 0; i < ticks.length; ++i) {
          var lw = label_size_.width(ticks[i]);
          if (lw > w) w = lw;
        }
        width_ = w + settings_.tick_length + settings_.tick_padding + settings_.padding;  
        return width_;
      } else {
        width_ = width;
        return this;
      }
    }
  };

  axis.height = function(height) {
    if (horizontal_) {
      // if horizontal the width is usually defined by the graph: the space it
      // needs to draw the tickmarks and labels etc. 
      if (arguments.length === 0) {
        var ticks = scale_.ticks();
        var h = 0;
        for (var i = 0; i < ticks.length; ++i) {
          var lh = label_size_.height(ticks[i]);
          if (lh > h) h = lh;
        }
        height_ = h + settings_.tick_length + settings_.tick_padding + settings_.padding; 
        return height_;
      } else {
        height_ = height;
        return this;
      }
    } else {
      // if vertical the width is usually given; this defines the range of
      // the scale
      if (arguments.length === 0) {
        return height_;
      } else {
        height_ = height;
        scale_.range([height_, 0]);
        return this;
      }
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'number';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale_.domain();
    } else {
      var range = d3.extent(data, function(d) { return +d[variable_];});
      var vschema = variable_schema(variable_, schema);
      if (vschema.origin) origin_ = vschema.origin;
      if (origin_ !== undefined) {
        if (range[0] > origin_) range[0] = origin_;
        if (range[1] < origin_) range[1] = origin_;
      }
      scale_.domain(range).nice();
      return this;
    }
  };

  axis.origin = function(origin) {
    if (arguments.length === 0) {
      return origin_;
    } else {
      origin_ = origin;
      return this;
    }
  };

  axis.ticks = function() {
    return scale_.ticks();
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return scale_(v[variable_]);
    } else {
      return scale_(v);
    }
  };

  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.linear = grph_axis_linear();



function grph_axis_period() {

  var scale_ = grph_scale_period();
  var height_;
  var variable_;
  var settings = {
    "tick_length" : [15, 30, 45]
  };

  var axis = function(g) {
    var ticks = scale_.ticks();

    var tick_length = {};
    var tick = 0;
    if (scale_.has_month()) tick_length.month = settings.tick_length[tick++];
    if (scale_.has_quarter()) tick_length.quarter = settings.tick_length[tick++];
    tick_length.year = settings.tick_length[tick++];

    g.selectAll("line.tick-end").data(ticks).enter().append("line")
      .attr("class", function(d) { 
        var last = d.last ? " ticklast" : "";
        return "tick tickend tick" + d.type + last;
      })
      .attr("x1", function(d) { return scale_(d.period.end);})
      .attr("y1", 0)
      .attr("x2", function(d) { return scale_(d.period.end);})
      .attr("y2", function(d) { return tick_length[d.type];});
    g.selectAll("line.tick-start").data(ticks).enter().append("line")
      .attr("class", function(d) { 
        var last = d.last ? " ticklast" : "";
        return "tick tickstart tick" + d.type + last;
      })
      .attr("x1", function(d) { return scale_(d.period.start);})
      .attr("y1", 0)
      .attr("x2", function(d) { return scale_(d.period.start);})
      .attr("y2", function(d) { return tick_length[d.type];});
    g.selectAll("text").data(ticks).enter().append("text")
      .attr("class", function(d) { return "ticklabel ticklabel" + d.type;})
      .attr("x", function(d) { return scale_(d.date);})
      .attr("y", function(d) { return tick_length[d.type];})
      .attr("text-anchor", "middle")
      .text(function(d) { 
        if (d.type == "month") {
          return d.period.start.format("MMM").charAt(0);
        } else if (d.type == "quarter") {
          return "Q" + d.period.start.format("Q");
        }
        return d.label;
      });
  };

  axis.height = function(height_) {
    if (arguments.length === 0) {
      if (height_ === undefined) {
        var tick = 0;
        if (scale_.has_month) tick++;
        if (scale_.has_quarter) tick++;
        return settings.tick_length[tick];
      } else {
        return height_;
      }
    } else {
      height_ = height;
      return this;
    }
  };

  axis.width = function(width) {
    if (arguments.length === 0) {
      var r = scale_.range();
      return r[1] - r[0];
    } else {
      scale_.range([0, width]);
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'date';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale_.domain();
    } else {
      var domain = data.map(function(d) { return d[variable_];});
      scale_.domain(domain);
      return this;
    }
  };


  axis.ticks = function() {
    var ticks = scale_.ticks();
    return ticks.filter(function(d) { return d.type == "year";});
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      if (v.hasOwnProperty("date") && v.hasOwnProperty("period")) {
        return scale_(v);
      } else {
        return scale_(v[variable_]);
      }
    } else {
      return scale_(v);
    }
  };


  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.period = grph_axis_period();



function grph_axis_region() {

  var variable_;
  var width_, height_;
  var map_loaded_;
  var map_;
  var index_ = {};

  function axis(g) {
  }

  axis.width = function(width) {
    if (arguments.length === 0) {
      return width_;
    } else {
      update_projection_ = update_projection_ || width_ != width;
      width_ = width;
      return this;
    }
  };

  axis.height = function(height) {
    if (arguments.length === 0) {
      return height_;
    } else {
      update_projection_ = update_projection_ || height_ != height;
      height_ = height;
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'string';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  };

  // Variable and function that keeps track of whether or not the map has 
  // finished loading. The method domain() loads the map. However, this happens
  // asynchronously. Therefore, it is possible (and often happens) that the map
  // has not yet loaded when scale() and transform() are called. The code 
  // calling these methods therefore needs to wait until the map has loaded. 
  var map_loading_ = false; 
  axis.map_loaded = function() {
    return !map_loading_;
  };

  function load_map(data, schema, callback) {
    if (variable_ === undefined) return ; // TODO
    var vschema = variable_schema(variable_, schema);
    if (vschema.map === undefined) return ; // TODO
    if (vschema.map == map_loaded_) return; 
    map_loading_ = true;
    // TODO handle errors in d3.json
    d3.json(vschema.map, function(json) {
      map_loaded_ = vschema.map;
      callback(json);
      map_loading_ = false;
    });
  }

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      //return scale.domain();
    } else {
      load_map(data, schema, function(map) {
        map_ = map;
        update_projection_ = true;
        // build index mapping region name on features 
        var vschema = variable_schema(variable_, schema);
        var regionid = vschema.regionid || "id";
        for (var feature in map_.features) {
          var name = map_.features[feature].properties[regionid];
          index_[name] = feature;
        }
      });
      return this;
    }
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return axis.scale(v[variable_]);
    } else {
      axis.update_projection();
      return path_(map_.features[index_[v]]);
    }
  };

  // The projection. Calculating the scale and translation of the projection 
  // takes time. Therefore, we only want to do that when necessary. 
  // update_projection_ keeps track of whether or not the projection needs 
  // recalculation
  var update_projection_ = true;
  // the projection
  var projection_ = d3.geo.transverseMercator()
    .rotate([-5.38720621, -52.15517440]).scale(1).translate([0,0]);
  var path_ = d3.geo.path().projection(projection_);
  // function that recalculates the scale and translation of the projection
  axis.update_projection = function() {
    if (update_projection_ && map_) {
      projection_.scale(1).translate([0,0]);
      path_ = d3.geo.path().projection(projection_);
      var bounds = path_.bounds(map_);
      var scale  = 0.95 / Math.max((bounds[1][0] - bounds[0][0]) / width_, 
                  (bounds[1][1] - bounds[0][1]) / height_);
      var transl = [(width_ - scale * (bounds[1][0] + bounds[0][0])) / 2, 
                  (height_ - scale * (bounds[1][1] + bounds[0][1])) / 2];
      projection_.scale(scale).translate(transl);
      update_projection_ = false;
    }
  };


  return axis;
}

// A function expecting two functions. The second function is called when the 
// first function returns true. When the first function does not return true
// we wait for 100ms and try again. 
var wait_for = function(m, f) {
  if (m()) {
    f();
  } else {
    setTimeout(function() { wait_for(m, f);}, 100);
  }
};

if (grph.axis === undefined) grph.axis = {};
grph.axis.linear = grph_axis_linear();



function grph_axis_size() {

  var variable_;
  var width, height;
  var scale = grph_scale_size();

  function axis(g) {
  }

  axis.width = function(w) {
    if (arguments.length === 0) {
      return width;
    } else {
      width = w;
      return this;
    }
  };

  axis.height = function(h) {
    if (arguments.length === 0) {
      return height;
    } else {
      height = h;
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'number';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable;
    } else {
      variable = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale.domain();
    } else {
      if (variable === undefined) return this;
      scale.domain(d3.extent(data, function(d) { return d[variable];}));
      return this;
    }
  };

  axis.ticks = function() {
    return scale.ticks();
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return axis.scale(v[variable]);
    } else {
      return scale(v);
    }
  };

  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.size = grph_axis_size();



function grph_axis_split() {

  var variable_;
  var width_, height_;
  var domain_;
  var ticks_;
  var settings_ = {
  };

  function axis(g) {
  }

  axis.width = function(width) {
    if (arguments.length === 0) {
      return width_;
    } else {
      width_ = width;
      return this;
    }
  };

  axis.height = function(height) {
    if (arguments.length === 0) {
      return height_;
    } else {
      height_ = height;
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == "categorical" || vschema.type == "period";
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  };
 
  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return domain_;
    } else {
      if (variable_ === undefined) return this;
      var vschema = variable_schema(variable_, schema);
      var categories = [];
      if (vschema.type == "categorical") {
        categories = vschema.categories.map(function(d) { return d.name; });
      } else {
        var vals = data.map(function(d) { return d[variable_];}).sort();
        var prev;
        for (var i = 0; i < vals.length; ++i) {
          if (vals[i] != prev) categories.push("" + vals[i]);
          prev = vals[i];
        }
      }
      domain_ = categories;
      var format = variable_value_formatter(variable_, schema);
      ticks_ = domain_.map(format);
      return this;
    }
  };

  axis.ticks = function() {
    return ticks_;
  };

  axis.scale = function(v) {
    return domain_.indexOf(v);
  };

  return axis;
}


function grph_axis_switch(axes) {

  var type = 0;

  var axis = function(g) {
    return axes[type](g);
  };

  axis.height = function(height_) {
    if (arguments.length === 0) {
      return axes[type].height();
    } else {
      for (var i=0; i<axes.length; ++i) axes[i].height(height_);
      return this;
    }
  };

  axis.width = function(width) {
    if (arguments.length === 0) {
      return axes[type].width();
    } else {
      for (var i=0; i<axes.length; ++i) axes[i].width(width);
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    for (var i=0; i<axes.length; ++i) {
      if (axes[i].accept(variable, schema))
        return true;
    }
    return false;
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return axes[type].variable();
    } else {
      for (var i=0; i<axes.length; ++i) axes[i].variable(v);
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return axes[type].variable();
    } else {
      var variable = axis.variable();
      for (var i=0; i<axes.length; ++i) {
        if (axes[i].accept(variable, schema)) {
          type = i;
          break;
        }
      }
      axes[type].domain(data, schema);
      return this;
    }
  };


  axis.ticks = function() {
    return axes[type].ticks();
  };

  axis.scale = function(v) {
    return axes[type].scale(v);
  };

  return axis;
}


function variable_schema(variable, schema) {
  for (var i = 0; i < schema.fields.length; i++) {
    if (schema.fields[i].name == variable) 
      return schema.fields[i];
  }
  return undefined;
}

function variable_value_formatter(variable, schema){
	for (var i = 0; i < schema.fields.length; i++){
		var field = schema.fields[i];
	    if (field.name == variable){
			switch(field.type){
				case "number":{
					return number_formatter(field);
				}
				case "categorical":{
					return categorical_formatter(field);
				}
				case "string":{
					return categorical_formatter(field);
				}				
				default:{
					return default_formatter(field);
				}
			}
	    }
	}
	return default_formatter();
}
// creates a formatter for pretty printing values for a specific field 
function value_formatter(schema){
	var formatters = {};
	for (var i = 0; i < schema.fields.length; i++){
		var field = schema.fields[i];
		switch(field.type){
			case "number":{
				formatters[field.name] = number_formatter(field);
				break;
			}
			case "categorical":{
				formatters[field.name] = categorical_formatter(field);
				break;
			}
			case "string":{
				formatters[field.name] = categorical_formatter(field);
				break;
			}
			default:{
				formatters[field.name] = default_formatter(field);
			}
		}
	}

	return function(datum, name){
		return formatters[name](datum[name]);
	};
}

function default_formatter(field){
	return function(value){
		return value;
	};
}

function categorical_formatter(field){
	var cat_titles = {};
	for (var i = 0; i < field.categories.length; i++){
		var cat = field.categories[i];
		cat_titles[cat.name] = cat.title || cat.name;
	}
	return function(value){
		return cat_titles[value];
	};
}

function number_formatter(field){
	//TODO use rounding?
	return function(value){
		return value.toString();
	};
}



function date_period(str) {

  function is_year(period) {
    // starting month should be 0
    if (period.start.month() !== 0) return false;
    // starting day of month should be 1
    if (period.start.date() != 1) return false;
    // length should be 1 year
    return period.length("years") == 1;
  }
  function is_quarter(period) {
    // starting month should be 0, 3, 6, or 9
    if ((period.start.month() % 3) !== 0) return false;
    // starting day of month should be 1
    if (period.start.date() != 1) return false;
    // length should be 3 months
    return period.length("months") == 3;
  }
  function is_month(period) {
    // starting day of month should be 1
    if (period.start.date() != 1) return false;
    // length should be 1 months
    return period.length("months") == 1;
  }

  var basic_year_regexp = /^(\d{4})$/;
  var basic_month_regexp = /^(\d{4})[Mm-]{1}(\d{1,2})$/;
  var basic_quarter_regexp = /^(\d{4})[Qq]{1}(\d{1,2})$/;

  var t0, dt, p, t, year;
  if (basic_year_regexp.test(str)) {
    str = basic_year_regexp.exec(str);
    year = +str[1];
    t0 = moment([+str[1]]);
    dt = moment.duration(1, "year");
    p  = dt.afterMoment(t0);
    t  = t0.add(moment.duration(p.length()/2));
    return {type: "year", date: t, period: p};
  } else if (basic_month_regexp.test(str)) {
    str = basic_month_regexp.exec(str);
    t0 = moment([+str[1], +str[2]-1]);
    dt = moment.duration(1, "month");
    p  = dt.afterMoment(t0);
    t  = t0.add(moment.duration(p.length()/2));
    return {type: "month", date: t, period: p};
  } else if (basic_quarter_regexp.test(str)) {
    str = basic_quarter_regexp.exec(str);
    year    = +str[1];
    var quarter = +str[2];
    t0 = moment([+str[1], (+str[2]-1)*3]);
    dt = moment.duration(3, "month");
    p  = dt.afterMoment(t0);
    t  = t0.add(moment.duration(p.length()/2));
    return {type: "quarter", date: t, period: p};
  } else if (typeof(str) == "string") {
    str = str.split("/");
    t0   = moment(str[0], moment.ISO_8601);
    if (str.length == 1) {
      dt = moment.duration(0);
      return {type: "date", date: t0, period: dt.afterMoment(t0)};
    } else {
      dt = moment.duration(str[1]);
      p  = dt.afterMoment(t0);
      t  = t0.add(moment.duration(p.length()/2));
      var type = "period";
      if (is_year(p)) { 
        type = "year";
      } else if (is_quarter(p)) { 
        type = "quarter";
      } else if (is_month(p)) {
        type = "month";
      }
      return {type: type, date: t, period: p};
    }
  } else {
    t0   = moment(str);
    dt = moment.duration(0);
    return {type: "date", date: t0, period: dt.afterMoment(t0)};
  }
}



function grph_generic_graph(axes, dispatch, type, graph_panel) {

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "dummy graph graph-" + type)
    .attr("width", 0).attr("height", 0)
    .style("visibility", "hidden");
  var label_size_ = grph_label_size(dummy_);


  var graph = grph_graph(axes, dispatch, function(g) {
    function nest_column(d) {
      return axes.column.variable() ? d[axes.column.variable()] : 1;
    }
    function nest_row(d) {
      return axes.row.variable() ? d[axes.row.variable()] : 1;
    }
    // setup axes
    for (var axis in axes) axes[axis].domain(graph.data(), graph.schema());
    // determine number of rows and columns
    var ncol = axes.column.variable() ? axes.column.ticks().length : 1;
    var nrow = axes.row.variable() ? axes.row.ticks().length : 1;
    // get labels and determine their height
    var vschemax = variable_schema(axes.x.variable(), graph.schema());
    var xlabel = vschemax.title;
    var label_height = label_size_.height(xlabel) + settings('label_padding');
    var vschemay = variable_schema(axes.y.variable(), graph.schema());
    var ylabel = vschemay.title;
    // set the width, height end domain of the x- and y-axes. We need some 
    // iterations for this, as the height of the y-axis depends of the height
    // of the x-axis, which depends on the labels of the x-axis, which depends
    // on the width of the x-axis, etc. 
    var rowlabel_width = axes.row.variable() ? 3*label_height : 0;
    var columnlabel_height = axes.column.variable() ? 3*label_height : 0;
    var w, h;
    for (var i = 0; i < 2; ++i) {
      w = graph.width() - settings('padding')[1] - settings('padding')[3] - 
        axes.y.width() - label_height - rowlabel_width;
      w = (w - (ncol-1)*settings('sep')) / ncol;
      axes.x.width(w).domain(graph.data(), graph.schema());
      h = graph.height() - settings('padding')[0] - settings('padding')[2] - 
        axes.x.height() - label_height - columnlabel_height;
      h = (h - (nrow-1)*settings('sep')) / nrow;
      axes.y.height(h).domain(graph.data(), graph.schema());
    }
    var l = axes.y.width() + settings('padding')[1] + label_height;
    var t  = settings('padding')[2] + columnlabel_height;
    // create group containing complete graph
    g = g.append("g").attr("class", "graph graph-" + type);
    // draw labels
    var ycenter = t + 0.5*(graph.height() - settings('padding')[0] - settings('padding')[2] - 
        axes.x.height() - label_height);
    var xcenter = l + 0.5*(graph.width() - settings('padding')[1] - settings('padding')[3] - 
        axes.y.width() - label_height);
    g.append("text").attr("class", "label label-y")
      .attr("x", settings('padding')[1]).attr("y", ycenter)
      .attr("text-anchor", "middle").text(ylabel)
      .attr("transform", "rotate(90 " + settings('padding')[1] + " " + ycenter + ")");
    g.append("text").attr("class", "label label-x")
      .attr("x", xcenter).attr("y", graph.height()-settings('padding')[0])
      .attr("text-anchor", "middle").text(xlabel);
    if (axes.row.variable()) {
      var xrow = graph.width() - settings('padding')[3] - label_height;
      var vschemarow = variable_schema(axes.row.variable(), graph.schema());
      var rowlabel = vschemarow.title;
      g.append("text").attr("class", "label label-y")
        .attr("x", xrow).attr("y", ycenter)
        .attr("text-anchor", "middle").text(rowlabel)
        .attr("transform", "rotate(90 " + xrow + " " + ycenter + ")");
    }
    if (axes.column.variable()) {
      var vschemacolumn = variable_schema(axes.column.variable(), graph.schema());
      var columnlabel = vschemacolumn.title;
      g.append("text").attr("class", "label label-y")
        .attr("x", xcenter).attr("y", settings("padding")[2]).attr("dy", "0.71em")
        .attr("text-anchor", "middle").text(columnlabel);
    }
    // create each of the panels
    var d = d3.nest().key(nest_column).key(nest_row).entries(graph.data());
    for (i = 0; i < d.length; ++i) {
      var dj = d[i].values;
      t  = settings('padding')[2] + columnlabel_height;
      for (var j = 0; j < dj.length; ++j) {
        // draw x-axis
        if (j == (dj.length-1)) {
          g.append("g").attr("class", "axis axis-x")
            .attr("transform", "translate(" + l + "," + (t + h) + ")").call(axes.x);
        }
        // draw y-axis
        if (i === 0) {
          g.append("g").attr("class", "axis axis-y")
            .attr("transform", "translate(" + (l - axes.y.width()) + "," + t + ")")
            .call(axes.y);
        }
        // draw row labels
        if (i == (d.length-1) && axes.row.variable()) {
          var rowtick = axes.row.ticks()[j];
          var grow = g.append("g").attr("class", "axis axis-row")
            .attr("transform", "translate(" + (l + w) + "," + t + ")");
          grow.append("rect").attr("class", "background")
            .attr("width", label_height + 2*settings("tick_padding"))
            .attr("height", h);
          grow.append("text").attr("class", "ticklabel")
            .attr("x", 0).attr("y", h/2)
            .attr("transform", "rotate(90 " + 
              (label_height - settings("tick_padding")) + " " + h/2 + ")")
            .attr("text-anchor", "middle").attr("dy", "0.35em")
            .text(rowtick);
        }
        // draw column labels
        if (j === 0 && axes.column.variable()) {
          var columntick = axes.column.ticks()[i];
          var coltickh = label_height + 2*settings("tick_padding");
          var gcolumn = g.append("g").attr("class", "axis axis-column")
            .attr("transform", "translate(" + l + "," + (t - coltickh) + ")");
          gcolumn.append("rect").attr("class", "background")
            .attr("width", w)
            .attr("height", label_height + 2*settings("tick_padding"));
          gcolumn.append("text").attr("class", "ticklabel")
            .attr("x", w/2).attr("y", settings("tick_padding"))
            .attr("text-anchor", "middle").attr("dy", "0.71em")
            .text(columntick);
        }
        // draw box for graph
        var gr = g.append("g").attr("class", "panel")
          .attr("transform", "translate(" + l + "," + t + ")");
        gr.append("rect").attr("class", "background")
          .attr("width", w).attr("height", h);
        // draw grid
        var xticks = axes.x.ticks();
        gr.selectAll("line.gridx").data(xticks).enter().append("line")
          .attr("class", "grid gridx")
          .attr("x1", axes.x.scale).attr("x2", axes.x.scale)
          .attr("y1", 0).attr("y2", h);
        var yticks = axes.y.ticks();
        gr.selectAll("line.gridy").data(yticks).enter().append("line")
          .attr("class", "grid gridy")
          .attr("x1", 0).attr("x2", w)
          .attr("y1", axes.y.scale).attr("y2", axes.y.scale);
        // add crosshairs to graph
        var gcrossh = gr.append("g").classed("crosshairs", true);
        gcrossh.append("line").classed("hline", true).attr("x1", 0)
          .attr("y1", 0).attr("x2", axes.x.width()).attr("y2", 0)
          .style("visibility", "hidden");
        gcrossh.append("line").classed("vline", true).attr("x1", 0)
          .attr("y1", 0).attr("x2", 0).attr("y2", axes.y.height())
          .style("visibility", "hidden");
        // draw panel
        graph_panel(gr, dj[j].values);
        // next panel
        t += axes.y.height() + settings('sep');
      }
      l += axes.x.width() + settings('sep');
    }
    // finished drawing call ready event
    dispatch.ready.call(g);
  });

  return graph;
}


function grph_graph(axes, dispatch, graph) {

  var width, height;
  var data, schema;

  graph.axes = function() {
    return d3.keys(axes);
  };

  graph.width = function(w) {
    if (arguments.length === 0) {
      return width;
    } else {
      width = w;
      return this;
    }
  };

  graph.height = function(h) {
    if (arguments.length === 0) {
      return height;
    } else {
      height = h;
      return this;
    }
  };

  graph.accept = function(variables, axis) {
    if (arguments.length > 1) {
      if (axes[axis] === undefined) return false;
      return axes[axis].accept(variables, schema);
    } else {
      for (var i in axes) {
        if (variables[i] === undefined) {
          if (axes[i].required) return false;
        } else {
          var accept = axes[i].accept(variables[i], schema);
          if (!accept) return false;
        }
      }
      return true;
    }
  };

  graph.assign = function(variables) {
    for (var i in axes) axes[i].variable(variables[i]);
    return this;
  };

  graph.schema = function(s) {
    if (arguments.length === 0) {
      return schema;
    } else {
      schema = s;
      return this;
    }
  };

  graph.data = function(d, s) {
    if (arguments.length === 0) {
      return data;
    } else {
      data = d;
      if (arguments.length > 1) 
        graph.schema(s);
      return this;
    }
  };

  graph.dispatch = function() {
    return dispatch;
  };

  return graph;
}



function grph_graph_bar() {

  var axes = {
    'x' : grph_axis_linear(true).origin(0),
    'y' : grph_axis_categorical(),
    'colour': grph_axis_colour(),
    'column' : grph_axis_split(),
    'row' : grph_axis_split()
  };
  axes.x.required = true;
  axes.y.required = true;
  var dispatch = d3.dispatch("mouseover", "mouseout", "click", "ready");

  var graph = grph_generic_graph(axes, dispatch, "bar", function(g, data) {
    function nest_colour(d) {
      return axes.colour.variable() ? d[axes.colour.variable()] : 1;
    }
    function get_x(d) {
      var v = axes.x.scale(d);
      return v < axes.x.scale(origin) ? v : axes.x.scale(origin);
    }
    function get_width(d) {
      return Math.abs(axes.x.scale(d) - axes.x.scale(origin));
    }
    function get_y(d) {
      return axes.y.scale.l(d) + i*axes.y.scale.w(d)/ncolours;
    }
    function get_height(d) {
      return axes.y.scale.w(d)/ncolours;
    }

    var d = d3.nest().key(nest_colour).entries(data);
    var ncolours = d.length;
    var origin = axes.x.origin();
    for (var i = 0; i < d.length; ++i) {
      var colour = axes.colour.scale(d[i].key);
      g.selectAll("rect." + colour).data(d[i].values).enter().append("rect")
        .attr("class", "bar " + colour).attr("x", get_x)
        .attr("width", get_width).attr("y", get_y).attr("height", get_height);
    }
    g.append("line").attr("class", "origin")
      .attr("x1", axes.x.scale(origin))
      .attr("x2", axes.x.scale(origin))
      .attr("y1", 0).attr("y2", axes.y.height());
  });

  // when finished drawing graph; add event handlers 
  dispatch.on("ready", function() {
    // add hover events to the lines and points
    var self = this;
    this.selectAll(".colour").on("mouseover", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseover.call(self, variable, value, d);
    }).on("mouseout", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseout.call(self, variable, value, d);
    }).on("click", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.click.call(self, variable, value, d);
    });
  });

  // Local event handlers
  dispatch.on("mouseover", function(variable, value, d) {
    if (variable) {
      var classes = axes.colour.scale("" + value);
      var regexp = /\bcolour([0-9]+)\b/;
      var colour = regexp.exec(classes)[0];
      this.selectAll(".colour").classed("colourlow", true);
      this.selectAll("." + colour).classed({"colourhigh": true, "colourlow": false});
    }
    this.selectAll(".hline").attr("y1", axes.y.scale(d)).attr("y2", axes.y.scale(d))
      .style("visibility", "visible");
    this.selectAll(".vline").attr("x1", axes.x.scale(d)).attr("x2", axes.x.scale(d))
      .style("visibility", "visible");
  });
  dispatch.on("mouseout", function(variable, value, d) {
    this.selectAll(".colour").classed({"colourhigh": false, "colourlow": false});
    this.selectAll(".hline").style("visibility", "hidden");
    this.selectAll(".vline").style("visibility", "hidden");
  });

  // Tooltip
  // when d3.tip is loaded
  if (d3.tip !== undefined) {
    var tip = d3.tip().direction("se").attr('class', 'tip tip-bar').html(function(variable, value, d) { 
      var schema = graph.schema();
      var format = value_formatter(schema);
      var str = '';
      for (var i in schema.fields) {
        var field = schema.fields[i];
        str += field.title + ': ' + format(d, field.name) + '</br>';
      }
      return str;
    });
    dispatch.on("ready.tip", function() {
      this.call(tip);
    });
    dispatch.on("mouseover.tip", function(variable, value, d) {
      tip.show(variable, value, d);
    });
    dispatch.on("mouseout.tip", function(variable, value, d) {
      tip.hide(variable, value, d);
    });
  }

  return graph;
}


function grph_graph_bubble() {

  var axes = {
    'x' : grph_axis_linear(true),
    'y' : grph_axis_linear(false),
    'object' : grph_axis_colour(),
    'size'   : grph_axis_size(),
    'colour' : grph_axis_colour(),
    'column' : grph_axis_split(),
    'row' : grph_axis_split()
  };
  axes.x.required = true;
  axes.y.required = true;
  axes.object.required = true;
  var dispatch = d3.dispatch("mouseover", "mouseout", "click", "ready");

  var graph = grph_generic_graph(axes, dispatch, "bubble", function(g, data) {
    function nest_object(d) {
      return axes.object.variable() ? d[axes.object.variable()] : 1;
    }
    function nest_colour(d) {
      return axes.colour.variable() ? d[axes.colour.variable()] : 1;
    }
    var d = d3.nest().key(nest_colour).entries(data);
    // draw bubbles 
    for (var i = 0; i < d.length; ++i) {
      g.selectAll("circle.bubble" + i).data(d[i].values).enter().append("circle")
        .attr("class", "bubble bubble" + i + " " + axes.colour.scale(d[i].key))
        .attr("cx", axes.x.scale).attr("cy", axes.y.scale)
        .attr("r", axes.size.scale);
    }
  });


  // when finished drawing graph; add event handlers 
  dispatch.on("ready", function() {
    // add hover events to the lines and points
    var self = this;
    this.selectAll(".colour").on("mouseover", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseover.call(self, variable, value, d);
    }).on("mouseout", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseout.call(self, variable, value, d);
    }).on("click", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.click.call(self, variable, value, d);
    });
  });

  // Local event handlers
  dispatch.on("mouseover", function(variable, value, d) {
    if (variable) {
      var classes = axes.colour.scale("" + value);
      var regexp = /\bcolour([0-9]+)\b/;
      var colour = regexp.exec(classes)[0];
      this.selectAll(".colour").classed("colourlow", true);
      this.selectAll("." + colour).classed({"colourhigh": true, "colourlow": false});
    }
    this.selectAll(".hline").attr("y1", axes.y.scale(d)).attr("y2", axes.y.scale(d))
      .style("visibility", "visible");
    this.selectAll(".vline").attr("x1", axes.x.scale(d)).attr("x2", axes.x.scale(d))
      .style("visibility", "visible");
  });
  dispatch.on("mouseout", function(variable, value, d) {
    this.selectAll(".colour").classed({"colourhigh": false, "colourlow": false});
    this.selectAll(".hline").style("visibility", "hidden");
    this.selectAll(".vline").style("visibility", "hidden");
  });

  // Tooltip
  // when d3.tip is loaded
  if (d3.tip !== undefined) {
    var tip = d3.tip().direction("se").attr('class', 'tip tip-bubble').html(function(variable, value, d) { 
      var schema = graph.schema();
      var format = value_formatter(schema);
      var str = '';
      for (var i in schema.fields) {
        var field = schema.fields[i];
        str += field.title + ': ' + format(d, field.name) + '</br>';
      }
      return str;
    });
    dispatch.on("ready.tip", function() {
      this.call(tip);
    });
    dispatch.on("mouseover.tip", function(variable, value, d) {
      tip.show(variable, value, d);
    });
    dispatch.on("mouseout.tip", function(variable, value, d) {
      tip.hide(variable, value, d);
    });
  }


  return graph;
}



function grph_graph_line() {

  var axes = {
    'x' : grph_axis_switch([grph_axis_linear(true), grph_axis_period()]),
    'y' : grph_axis_linear(false),
    'colour' : grph_axis_colour(),
    'column' : grph_axis_split(),
    'row' : grph_axis_split()
  };
  axes.x.required = true;
  axes.y.required = true;
  var dispatch = d3.dispatch("mouseover", "mouseout", "pointover", "pointout",
    "click", "ready");

  var graph = grph_generic_graph(axes, dispatch, "line", function(g, data) {
    function nest_colour(d) {
      return axes.colour.variable() ? d[axes.colour.variable()] : 1;
    }
    var d = d3.nest().key(nest_colour).entries(data);
    // draw lines 
    var line = d3.svg.line().x(axes.x.scale).y(axes.y.scale);
    for (var i = 0; i < d.length; ++i) {
      g.append("path").attr("d", line(d[i].values))
        .attr("class", axes.colour.scale(d[i].key))
        .datum(d[i]);
    }
    // draw points 
    for (i = 0; i < d.length; ++i) {
      var cls = "circle" + i;
      g.selectAll("circle.circle" + i).data(d[i].values).enter().append("circle")
        .attr("class", "circle" + i + " " + axes.colour.scale(d[i].key))
        .attr("cx", axes.x.scale).attr("cy", axes.y.scale)
        .attr("r", settings('point_size'));
    }
  });

  // when finished drawing graph; add event handlers 
  dispatch.on("ready", function() {
    // add hover events to the lines and points
    var self = this;
    this.selectAll(".colour").on("mouseover", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseover.call(self, variable, value, d);
      if (!d.key) dispatch.pointover.call(self, variable, value, d);
    }).on("mouseout", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseout.call(self, variable, value, d);
      if (!d.key) dispatch.pointout.call(self, variable, value, d);
    }).on("click", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.click.call(self, variable, value, d);
    });
  });
  // Local event handlers
  // Highlighting of selected line
  dispatch.on("mouseover", function(variable, value, d) {
    if (variable) {
      var classes = axes.colour.scale("" + value);
      var regexp = /\bcolour([0-9]+)\b/;
      var colour = regexp.exec(classes)[0];
      this.selectAll(".colour").classed("colourlow", true);
      this.selectAll("." + colour).classed({"colourhigh": true, "colourlow": false});
    }
  });
  dispatch.on("mouseout", function(variable, value, d) {
    this.selectAll(".colour").classed({"colourhigh": false, "colourlow": false});
  });
  // Show crosshairs when hovering over a point
  dispatch.on("pointover", function(variable, value, d) {
    this.selectAll(".hline").attr("y1", axes.y.scale(d)).attr("y2", axes.y.scale(d))
      .style("visibility", "visible");
    this.selectAll(".vline").attr("x1", axes.x.scale(d)).attr("x2", axes.x.scale(d))
      .style("visibility", "visible");
  });
  dispatch.on("pointout", function(variable, value, d) {
    this.selectAll(".hline").style("visibility", "hidden");
    this.selectAll(".vline").style("visibility", "hidden");
  });

  // Tooltip
  // when d3.tip is loaded
  if (d3.tip !== undefined) {
    var tip = d3.tip().direction("se").attr('class', 'tip tip-line').html(function(variable, value, d) { 
      var schema = graph.schema();
      var format = value_formatter(schema);
      var str = '';
      for (var i in schema.fields) {
        var field = schema.fields[i];
        str += field.title + ': ' + format(d,field.name) + '</br>';
      }
      return str;
    });
    dispatch.on("ready.tip", function() {
      this.call(tip);
    });
    dispatch.on("pointover.tip", function(variable, value, d) {
      tip.show(variable, value, d);
    });
    dispatch.on("pointout.tip", function(variable, value, d) {
      tip.hide(variable, value, d);
    });
  }

  return graph;
}




function grph_graph_map() {

  var axes = {
    'region' : grph_axis_region(),
    'colour' : grph_axis_chloropleth(),
    'column' : grph_axis_split(),
    'row' : grph_axis_split()
  };
  axes.region.required = true;
  axes.colour.required = true;
  var dispatch = d3.dispatch("ready", "mouseover", "mouseout", "click");

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "dummy graph graph-map")
    .attr("width", 0).attr("height", 0)
    .style("visibility", "hidden");
  var label_size_ = grph_label_size(dummy_);


  var graph = grph_graph(axes, dispatch, function(g) {
    function nest_column(d) {
      return axes.column.variable() ? d[axes.column.variable()] : 1;
    }
    function nest_row(d) {
      return axes.row.variable() ? d[axes.row.variable()] : 1;
    }
    // setup axes
    axes.region.domain(graph.data(), graph.schema());
    axes.colour.domain(graph.data(), graph.schema());
    axes.column.domain(graph.data(), graph.schema());
    axes.row.domain(graph.data(), graph.schema());

    // determine number of rows and columns
    var ncol = axes.column.variable() ? axes.column.ticks().length : 1;
    var nrow = axes.row.variable() ? axes.row.ticks().length : 1;
    // set the width, height end domain of the x- and y-axes
    var label_height = label_size_.height("variable") + settings('label_padding');
    var rowlabel_width = axes.row.variable() ? 3*label_height : 0;
    var columnlabel_height = axes.column.variable() ? 3*label_height : 0;
    var w = (graph.width() - settings("padding", "map")[1] - settings("padding", "map")[3] - 
      rowlabel_width - (ncol-1)*settings("sep", "map"))/ncol;
    var h = (graph.height() - settings("padding", "map")[0] - settings("padding", "map")[2] - 
      columnlabel_height - (nrow-1)*settings("sep", "map"))/nrow;
    var l = settings("padding", "map")[1];
    var t  = settings("padding", "map")[2];
    axes.region.width(w).height(h);
    // create group containing complete graph
    g = g.append("g").attr("class", "graph graph-map");
    // draw labels
    var ycenter = t + 0.5*(graph.height() - settings('padding')[0] - settings('padding')[2] - 
        label_height - columnlabel_height) + columnlabel_height;
    var xcenter = l + 0.5*(graph.width() - settings('padding')[1] - settings('padding')[3] - 
        label_height - rowlabel_width);
    if (axes.row.variable()) {
      var xrow = graph.width() - settings('padding')[3] - label_height;
      var vschemarow = variable_schema(axes.row.variable(), schema);
      var rowlabel = vschemarow.title;
      g.append("text").attr("class", "label label-y")
        .attr("x", xrow).attr("y", ycenter)
        .attr("text-anchor", "middle").text(rowlabel)
        .attr("transform", "rotate(90 " + xrow + " " + ycenter + ")");
    }
    if (axes.column.variable()) {
      var vschemacolumn = variable_schema(axes.column.variable(), schema);
      var columnlabel = vschemacolumn.title;
      g.append("text").attr("class", "label label-y")
        .attr("x", xcenter).attr("y", settings("padding")[2]).attr("dy", "0.71em")
        .attr("text-anchor", "middle").text(columnlabel);
    }
    // draw graphs
    wait_for(axes.region.map_loaded, function() {
      var d = d3.nest().key(nest_column).key(nest_row).entries(graph.data());
      for (var i = 0; i < d.length; ++i) {
        var dj = d[i].values;
        var t  = settings("padding", "map")[2] + columnlabel_height;
        for (var j = 0; j < dj.length; ++j) {
          // draw row labels
          if (i == (d.length-1) && axes.row.variable()) {
            var rowtick = axes.row.ticks()[j];
            var grow = g.append("g").attr("class", "axis axis-row")
              .attr("transform", "translate(" + (l + w) + "," + t + ")");
            grow.append("rect").attr("class", "background")
              .attr("width", label_height + 2*settings("tick_padding"))
              .attr("height", h);
            grow.append("text").attr("class", "ticklabel")
              .attr("x", 0).attr("y", h/2)
              .attr("transform", "rotate(90 " + 
                (label_height - settings("tick_padding")) + " " + h/2 + ")")
              .attr("text-anchor", "middle").attr("dy", "0.35em")
              .text(rowtick);
          }
          // draw column labels
          if (j === 0 && axes.column.variable()) {
            var columntick = axes.column.ticks()[i];
            var coltickh = label_height + 2*settings("tick_padding");
            var gcolumn = g.append("g").attr("class", "axis axis-column")
              .attr("transform", "translate(" + l + "," + (t - coltickh) + ")");
            gcolumn.append("rect").attr("class", "background")
              .attr("width", w)
              .attr("height", label_height + 2*settings("tick_padding"));
            gcolumn.append("text").attr("class", "ticklabel")
              .attr("x", w/2).attr("y", settings("tick_padding"))
              .attr("text-anchor", "middle").attr("dy", "0.71em")
              .text(columntick);
          }
          // draw box for graph
          var gr = g.append("g").attr("class", "map")
            .attr("transform", "translate(" + l + "," + t + ")");
          gr.append("rect").attr("class", "background")
            .attr("width", w).attr("height", h);
          // draw map
          gr.selectAll("path").data(dj[j].values).enter().append("path")
            .attr("d", axes.region.scale).attr("class", axes.colour.scale);
          // next line
          t += h + settings("sep", "map");
        }
        l += w + settings("sep", "map");
      }
      // add events to the lines
      g.selectAll("path").on("mouseover", function(d, i) {
        var region = d[axes.region.variable()];
        dispatch.mouseover.call(g, axes.region.variable(), region, d);
      }).on("mouseout", function(d, i) {
        var region = d[axes.region.variable()];
        dispatch.mouseout.call(g, axes.region.variable(), region, d);
      }).on("click", function(d, i) {
        var region = d[axes.region.variable()];
        dispatch.click.call(g, axes.region.variable(), region, d);
      });
      // finished drawing call ready event
      dispatch.ready.call(g);
    });
  });


  // Local event handlers
  dispatch.on("mouseover.graph", function(variable, value, d) {
    this.selectAll("path").classed("colourlow", true);
    this.selectAll("path").filter(function(d, i) {
      return d[variable] == value;
    }).classed({"colourhigh": true, "colourlow": false});
  });
  dispatch.on("mouseout.graph", function(variable, value, d) {
    this.selectAll("path").classed({"colourhigh": false, "colourlow": false});
  });
  
  // tooltip
  if (d3.tip !== undefined) {
    var tip = d3.tip().direction("se").attr('class', 'tip tip-map').html(function(variable, value, d) { 
      var schema = graph.schema();
      var format = value_formatter(schema);
      var str = '';
      for (var i in schema.fields) {
        var field = schema.fields[i];
        str += field.title + ': ' + format(d, field.name) + '</br>';
      }
      return str;
    });
    dispatch.on("ready.tip", function() {
      this.call(tip);
    });
    dispatch.on("mouseover.tip", function(variable, value, d) {
      tip.show(variable, value, d);
    });
    dispatch.on("mouseout.tip", function(variable, value, d) {
      tip.hide(variable, value, d);
    });
  }

  return graph;
}



function grph_label_size(g) {

  // a svg or g element to which  we will be adding our label in order to
  // request it's size
  var g_ = g;
  // store previously calculated values; as the size of certain labels are 
  // requested again and again this greatly enhances performance
  var sizes_ = {};

  function label_size(label) {
    if (sizes_[label]) {
      return sizes_[label];
    }
    if (!g_) return [undefined, undefined];
    var text = g_.append("text").text(label);
    var bbox = text[0][0].getBBox();
    var size = [bbox.width*1.2, bbox.height*0.65]; // TODO why; and is this always correct
    //var size = horizontal_ ? text[0][0].getComputedTextLength() :
      //text[0][0].getBBox().height;
    text.remove();
    sizes_[label] = size;
    return size;
  }

  label_size.svg = function(g) {
    if (arguments.length === 0) {
      return g_;
    } else {
      g_ = g;
      return this;
    }
  };

  label_size.width = function(label) {
    var size = label_size(label);
    return size[0];
  };

  label_size.height = function(label) {
    var size = label_size(label);
    return size[1];
  };

  return label_size;
}



function grph_scale_categorical() {

  var domain;
  var range = [0, 1];

  function scale(v) {
    var i = domain.indexOf(v);
    if (i < 0) return {l: undefined, m:undefined, u:undefined};
    var bw = (range[1] - range[0]) / domain.length;
    var m = bw*(i + 0.5);
    var w = bw*(1 - settings("bar_padding"))*0.5;
    return {l:m-w, m:m, u:m+w};
  }

  scale.l = function(v) {
    return scale(v).l;
  };

  scale.m = function(v) {
    return scale(v).m;
  };

  scale.u = function(v) {
    return scale(v).u;
  };

  scale.domain = function(d) {
    if (arguments.length === 0) {
      return domain;
    } else {
      domain = d;
      return this;
    }
  };

  scale.range = function(r) {
    if (arguments.length === 0) {
      return range;
    } else {
      range = r;
      return this;
    }
  };

  scale.ticks = function() {
    return domain;
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.categorical = grph_scale_categorical;



function grph_scale_chloropleth() {

  var domain;
  var baseclass = "chloro";
  var ncolours  = 9;

  function scale(v) {
    if (domain === undefined) {
      // assume we have only 1 colour
      return baseclass + " " + baseclass + "n1" + " " + baseclass + 1;
    }
    var range  = domain[1] - domain[0];
    var val    = Math.sqrt((v - domain[0])*0.9999) / Math.sqrt(range);
    var cat    = Math.floor(val*ncolours);
    // returns something like "chloro chloron10 chloro4"
    return baseclass + " " + baseclass + "n" + ncolours + " " + baseclass + (cat+1);
  }

  scale.domain = function(d) {
    if (arguments.length === 0) {
      return domain;
    } else {
      domain = d;
      return this;
    }
  };

  scale.range = function(r) {
    if (arguments.length === 0) {
      return baseclass;
    } else {
      baseclass = r;
      return this;
    }
  };

  scale.ticks = function() {
    var step = (domain[1] - domain[0])/ncolours;
    var t = domain[0];
    var ticks = [];
    for (var i = 0; i <= ncolours; ++i) {
      ticks.push(t);
      t += step;
    }
    return ticks;
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.chloropleth = grph_scale_chloropleth();



function grph_scale_colour() {

  var domain;
  var range = "colour";
  var ncolours;

  function scale(v) {
    if (domain === undefined) {
      // assume we have only 1 colour
      return range + " " + range + "n1" + " " + range + 1;
    }
    var i = domain.indexOf(v);
    // returns something like "colour colourn10 colour4"
    return range + " " + range + "n" + ncolours + " " + range + (i+1);
  }

  scale.domain = function(d) {
    if (arguments.length === 0) {
      return domain;
    } else {
      domain = d;
      ncolours = d.length;
      return this;
    }
  };

  scale.range = function(r) {
    if (arguments.length === 0) {
      return range;
    } else {
      range = r;
      return this;
    }
  };

  scale.ticks = function() {
    return domain;
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.colour = grph_scale_colour();



function grph_scale_linear() {

  var lscale = d3.scale.linear();
  var label_size_ = 20;
  var padding_ = 5;
  var nticks_ = 10;
  var ticks_;
  var ndec_;
  var inside_ = true;

  function scale(v) {
    return lscale(v);
  }

  scale.domain = function(d) {
    d = lscale.domain(d);
    ndec_ = undefined;
    ticks_ = undefined;
    if (arguments.length === 0) {
      return d;
    } else {
      return this;
    }
  };

  scale.range = function(r) {
    r = lscale.range(r);
    ndec_ = undefined;
    ticks_ = undefined;
    if (arguments.length === 0) {
      return r;
    } else {
      return this;
    }
  };

  scale.label_size = function(label_size) {
    if (arguments.length === 0) {
      return label_size_;
    } else {
      label_size_ = label_size;
      return this;
    }
  };

  function lsize(label) {
    var size = typeof(label_size_) == "function" ? label_size_(label) : label_size_;
    size += padding_;
    return size;
  }

  scale.nticks = function(n) {
    if (arguments.length === 0) {
      return nticks_;
    } else {
      nticks_ = n;
      return this;
    }
  };

  scale.inside = function(i) {
    if (arguments.length === 0) {
      return inside_;
    } else {
      inside_ = i ? true : false;
      return this;
    }
  };

  scale.nice = function() {
    var r = lscale.range();
    var d = lscale.domain();
    var l = Math.abs(r[1] - r[0]);
    var w = wilkinson_ii(d[0], d[1], nticks_, lsize, l);
    if (inside_) {
      var w1 = lsize(w.labels[0]);
      var w2 = lsize(w.labels[w.labels.length-1]);
      var pad = w1/2 + w2/2;
      w = wilkinson_ii(d[0], d[1], nticks_, lsize, l-pad);
      if (r[0] < r[1]) {
        lscale.range([r[0]+w1/2, r[1]-w2/2]);
      } else {
        lscale.range([r[0]-w1/2, r[1]+w2/2]);
      }
    }
    domain = [w.lmin, w.lmax];
    lscale.domain([w.lmin, w.lmax]);
    ticks_ = w.labels;
    ndec_ = w.ndec;
    return this;
  };

  scale.ticks = function() {
    if (ticks_ === undefined) return lscale.ticks(nticks_);
    return ticks_.map(function(t) { return format_number(t, "", ndec_);});
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.linear = grph_scale_linear();


function grph_scale_period() {

  var time_scale = d3.time.scale();
  var years_;
  var has_month_ = false;
  var has_quarter_ = false;

  function scale(val) {
    if ((val instanceof Date) || moment.isMoment(val)) {
      return time_scale(val);
    } else if (val && val.date && val.period) {
      time_scale(val.date);
    } else {
      val = "" + val;
      return time_scale(date_period(val).date);
    }
  }

  scale.has_month = function() {
    return has_month_;
  };

  scale.has_quarter = function() {
    return has_quarter_;
  };

  scale.domain = function(domain) {
    var periods = domain.map(date_period);
    // determine which years are in domain; axis wil always draw complete
    // years
    years_ = d3.extent(periods, function(d) {
      return d.period.start.year();
    });
    // set domain
    time_scale.domain([new Date(years_[0] + "-01-01"), 
        new Date((years_[1]+1) + "-01-01")]);
    // determine which subunits of years should be drawn
    has_month_ = periods.reduce(function(p, d) {
      return p || d.type == "month";
    }, false);
    has_quarter_ = periods.reduce(function(p, d) {
      return p || d.type == "quarter";
    }, false);
    return this;
  };

  scale.range = function(range) {
    if (arguments.length === 0) return time_scale.range();
    time_scale.range(range);
    return this;
  };

  scale.ticks = function() {
    var ticks = [];
    for (var year = years_[0]; year <= years_[1]; year++) {
      var tick = date_period(year + "-01-01/P1Y");
      tick.last = year == years_[1];
      tick.label = year;
      ticks.push(tick);

      if (scale.has_quarter()) {
        for (var q = 0; q < 4; q++) {
          tick = date_period(year + "-" + zeroPad(q*3+1, 2) + "-01/P3M");
          tick.last = q == 3;
          tick.label = q+1;
          ticks.push(tick);
        }
      } 
      if (scale.has_month()) {
        for (var m = 0; m < 12; m++) {
          tick = date_period(year + "-" + zeroPad(m+1,2) + "-01/P1M");
          tick.last = (scale.has_quarter() && ((m+1) % 3) === 0) || m == 11;
          tick.label = m+1;
          ticks.push(tick);
        }
      } 
    }
    return ticks;
  };

  return scale;
}


if (grph.scale === undefined) grph.scale = {};
grph.scale.period = grph_scale_period();



function grph_scale_size() {
  
  var max;
  var domain;

  function scale(v) {
    if (domain === undefined) {
      return settings("default_bubble");
    } else {
      var m = max === undefined ? settings("max_bubble") : max;
      return m * Math.sqrt(v)/Math.sqrt(domain[1]);
    }
  }

  scale.domain = function(d) {
    if (arguments.length === 0) {
      return domain;
    } else {
      domain = d3.extent(d);
      return this;
    }
  };

  scale.range = function(r) {
    if (arguments.length === 0) {
      return max === undefined ? settings("max_bubble") : max;
    } else {
      max = d3.max(r);
      return this;
    }
  };

  scale.ticks = function() {
    return undefined;
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.size = grph_scale_size();




var settings = function() {
  var s = {
    'default' : {
      'padding' : [2, 2, 2, 2],
      'label_padding' : 4,
      'sep' : 8,
      'point_size' : 4,
      'max_bubble' : 20,
      'default_bubble' : 5,
      'bar_padding' : 0.4,
      'tick_length' : 5,
      'tick_padding' : 2
    }
  };

  function get(setting, type) {
    if (arguments.length === 0) {
      return settings;
    } else if (arguments.length === 2) {
      if (s[type] !== undefined && s[type][setting] !== undefined) {
        return s[type][setting];
      } else {
        return s.default[setting];
      }
    } else {
      return s.default[setting];
    }
  }

  get.set = function(setting, a, b) {
    if (arguments.length === 2) {
      s.default[setting] = a;
      return this;
    } else if (arguments.length === 3) {
      if (s[a] === undefined) s[a] = {};
      s[a][setting] = b;
      return this;
    } else {
      throw new Error("Need at leat two arguments.");
    }
  };

  return get;
}();

grph.settings = settings;


// Convert a number to string padding it with zeros until the number of 
// characters before the decimal symbol equals length (not including sign)
function zero_pad(num, length) {
  var n = Math.abs(num);
  var nzeros = Math.max(0, length - Math.floor(n).toString().length );
  var padding = Math.pow(10, nzeros).toString().substr(1);
  if( num < 0 ) {
    padding = '-' + padding;
  }
  return padding + n;
}


// Format a numeric value:
// - Make sure it is rounded to the correct number of decimals (ndec)
// - Use the correct decimal separator (dec)
// - Add a thousands separator (grp)
function format_number(label, unit, ndec, dec, grp) {
  if (isNaN(label)) return '';
  if (unit === undefined) unit = '';
  if (dec === undefined) dec = '.';
  if (grp === undefined) grp = '';
  // round number
  if (ndec !== undefined) {
    label = label.toFixed(ndec);
  } else {
    label = label.toString();
  }
  // Following based on code from 
  // http://www.mredkj.com/javascript/numberFormat.html
  x     = label.split('.');
  x1    = x[0];
  x2    = x.length > 1 ? dec + x[1] : '';
  if (grp !== '') {
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + grp + '$2');
    }
  }
  return(x1 + x2 + unit);
}





// Format a numeric value:
// - Make sure it is rounded to the correct number of decimals (ndec)
// - Use the correct decimal separator (dec)
// - Add a thousands separator (grp)
format_numeric = function(label, unit, ndec, dec, grp) {
  if (isNaN(label)) return '';
  if (unit === undefined) unit = '';
  if (dec === undefined) dec = ',';
  if (grp === undefined) grp = ' ';
  // round number
  if (ndec !== undefined) {
    label = label.toFixed(ndec);
  } else {
    label = label.toString();
  }
  // Following based on code from 
  // http://www.mredkj.com/javascript/numberFormat.html
  x     = label.split('.');
  x1    = x[0];
  x2    = x.length > 1 ? dec + x[1] : '';
  if (grp !== '') {
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + grp + '$2');
    }
  }
  return(x1 + x2 + unit);
};



// ============================================================================
// ====                         WILKINSON ALGORITHM                        ====
// ============================================================================


function wilkinson_ii(dmin, dmax, m, calc_label_width, axis_width, mmin, mmax, Q, precision, mincoverage) {
  // ============================ SUBROUTINES =================================

  // The following routine checks for overlap in the labels. This is used in the 
  // Wilkinson labeling algorithm below to ensure that the labels do not overlap.
  function overlap(lmin, lmax, lstep, calc_label_width, axis_width, ndec) {
    var width_max = lstep*axis_width/(lmax-lmin);
    for (var l = lmin; (l - lmax) <= 1E-10; l += lstep) {
      var w  = calc_label_width(l, ndec);
      if (w > width_max) return(true);
    }
    return(false);
  }

  // Perform one iteration of the Wilkinson algorithm
  function wilkinson_step(min, max, k, m, Q, mincoverage) {
    // default values
    Q               = Q         || [10, 1, 5, 2, 2.5, 3, 4, 1.5, 7, 6, 8, 9];
    precision       = precision || [1,  0, 0, 0,  -1, 0, 0,  -1, 0, 0, 0, 0];
    mincoverage     = mincoverage || 0.8;
    m               = m || k;
    // calculate some stats needed in loop
    var intervals   = k - 1;
    var delta       = (max - min) / intervals;
    var base        = Math.floor(Math.log(delta)/Math.LN10);
    var dbase       = Math.pow(10, base);
    // calculate granularity; one of the terms in score
    var granularity = 1 - Math.abs(k-m)/m;
    // initialise end result
    var best;
    // loop through all possible label positions with given k
    for(var i = 0; i < Q.length; i++) {
      // calculate label positions
      var tdelta = Q[i] * dbase;
      var tmin   = Math.floor(min/tdelta) * tdelta;
      var tmax   = tmin + intervals * tdelta;
      // calculate the number of decimals
      var ndec   = (base + precision[i]) < 0 ? Math.abs(base + precision[i]) : 0;
      // if label positions cover range
      if (tmin <= min && tmax >= max) {
        // calculate roundness and coverage part of score
        var roundness = 1 - (i - (tmin <= 0 && tmax >= 0)) / Q.length;
        var coverage  = (max-min)/(tmax-tmin);
        // if coverage high enough
        if (coverage > mincoverage && !overlap(tmin, tmax, tdelta, calc_label_width, axis_width, ndec)) {
          // calculate score
          var tnice = granularity + roundness + coverage;
          // if highest score
          if ((best === undefined) || (tnice > best.score)) {
            best = {
                'lmin'  : tmin,
                'lmax'  : tmax,
                'lstep' : tdelta,
                'score' : tnice,
                'ndec'  : ndec
              };
          }
        }
      }
    }
    // return
    return (best);
  }

  // =============================== MAIN =====================================
  // default values
  dmin             = Number(dmin);
  dmax             = Number(dmax);
  if (Math.abs(dmin - dmax) < 1E-10) {
    dmin = 0.96*dmin;
    dmax = 1.04*dmax;
  }
  calc_label_width = calc_label_width || function() { return(0);};
  axis_width       = axis_width || 1;
  Q                = Q         || [10, 1, 5, 2, 2.5, 3, 4, 1.5, 7, 6, 8, 9];
  precision        = precision || [1,  0, 0, 0,  -1, 0, 0,  -1, 0, 0, 0, 0];
  mincoverage      = mincoverage || 0.8;
  mmin             = mmin || 2;
  mmax             = mmax || Math.ceil(6*m);
  // initilise end result
  var best = {
      'lmin'  : dmin,
      'lmax'  : dmax,
      'lstep' : (dmax - dmin),
      'score' : -1E8,
      'ndec'  : 0
    };
  // calculate number of decimal places
  var x = String(best.lstep).split('.');
  best.ndec = x.length > 1 ? x[1].length : 0;
  // loop though all possible numbers of labels
  for (var k = mmin; k <= mmax; k++) { 
    // calculate best label position for current number of labels
    var result = wilkinson_step(dmin, dmax, k, m, Q, mincoverage);
    // check if current result has higher score
    if ((result !== undefined) && ((best === undefined) || (result.score > best.score))) {
      best = result;
    }
  }
  // generate label positions
  var labels = [];
  for (var l = best.lmin; (l - best.lmax) <= 1E-10; l += best.lstep) {
    labels.push(l);
  }
  best.labels = labels;
  return(best);
}



  
  grph.line = grph_graph_line;
  grph.map = grph_graph_map;
  grph.bubble = grph_graph_bubble;
  grph.bar = grph_graph_bar;

  this.grph = grph;

}());


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vbWVudC5qcyIsInR3aXguanMiLCJiZWdpbi5qcyIsImF4aXNfY2F0ZWdvcmljYWwuanMiLCJheGlzX2NobG9yb3BsZXRoLmpzIiwiYXhpc19jb2xvdXIuanMiLCJheGlzX2xpbmVhci5qcyIsImF4aXNfcGVyaW9kLmpzIiwiYXhpc19yZWdpb24uanMiLCJheGlzX3NpemUuanMiLCJheGlzX3NwbGl0LmpzIiwiYXhpc19zd2l0Y2guanMiLCJkYXRhcGFja2FnZS5qcyIsImRhdGVfcGVyaW9kLmpzIiwiZ2VuZXJpY19ncmFwaC5qcyIsImdyYXBoLmpzIiwiZ3JhcGhfYmFyLmpzIiwiZ3JhcGhfYnViYmxlLmpzIiwiZ3JhcGhfbGluZS5qcyIsImdyYXBoX21hcC5qcyIsImxhYmVsX3NpemUuanMiLCJzY2FsZV9jYXRlZ29yaWNhbC5qcyIsInNjYWxlX2NobG9yb3BsZXRoLmpzIiwic2NhbGVfY29sb3VyLmpzIiwic2NhbGVfbGluZWFyLmpzIiwic2NhbGVfcGVyaW9kLmpzIiwic2NhbGVfc2l6ZS5qcyIsInNldHRpbmdzLmpzIiwidXRpbHMuanMiLCJ3aWxraW5zb24uanMiLCJlbmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNXRCQTtBQUNBO0FBQ0E7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ3JwaC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vISBtb21lbnQuanNcclxuLy8hIHZlcnNpb24gOiAyLjcuMFxyXG4vLyEgYXV0aG9ycyA6IFRpbSBXb29kLCBJc2tyZW4gQ2hlcm5ldiwgTW9tZW50LmpzIGNvbnRyaWJ1dG9yc1xyXG4vLyEgbGljZW5zZSA6IE1JVFxyXG4vLyEgbW9tZW50anMuY29tXHJcblxyXG4oZnVuY3Rpb24gKHVuZGVmaW5lZCkge1xyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBDb25zdGFudHNcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgICB2YXIgbW9tZW50LFxyXG4gICAgICAgIFZFUlNJT04gPSBcIjIuNy4wXCIsXHJcbiAgICAgICAgLy8gdGhlIGdsb2JhbC1zY29wZSB0aGlzIGlzIE5PVCB0aGUgZ2xvYmFsIG9iamVjdCBpbiBOb2RlLmpzXHJcbiAgICAgICAgZ2xvYmFsU2NvcGUgPSB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMsXHJcbiAgICAgICAgb2xkR2xvYmFsTW9tZW50LFxyXG4gICAgICAgIHJvdW5kID0gTWF0aC5yb3VuZCxcclxuICAgICAgICBpLFxyXG5cclxuICAgICAgICBZRUFSID0gMCxcclxuICAgICAgICBNT05USCA9IDEsXHJcbiAgICAgICAgREFURSA9IDIsXHJcbiAgICAgICAgSE9VUiA9IDMsXHJcbiAgICAgICAgTUlOVVRFID0gNCxcclxuICAgICAgICBTRUNPTkQgPSA1LFxyXG4gICAgICAgIE1JTExJU0VDT05EID0gNixcclxuXHJcbiAgICAgICAgLy8gaW50ZXJuYWwgc3RvcmFnZSBmb3IgbGFuZ3VhZ2UgY29uZmlnIGZpbGVzXHJcbiAgICAgICAgbGFuZ3VhZ2VzID0ge30sXHJcblxyXG4gICAgICAgIC8vIG1vbWVudCBpbnRlcm5hbCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgbW9tZW50UHJvcGVydGllcyA9IHtcclxuICAgICAgICAgICAgX2lzQU1vbWVudE9iamVjdDogbnVsbCxcclxuICAgICAgICAgICAgX2kgOiBudWxsLFxyXG4gICAgICAgICAgICBfZiA6IG51bGwsXHJcbiAgICAgICAgICAgIF9sIDogbnVsbCxcclxuICAgICAgICAgICAgX3N0cmljdCA6IG51bGwsXHJcbiAgICAgICAgICAgIF90em0gOiBudWxsLFxyXG4gICAgICAgICAgICBfaXNVVEMgOiBudWxsLFxyXG4gICAgICAgICAgICBfb2Zmc2V0IDogbnVsbCwgIC8vIG9wdGlvbmFsLiBDb21iaW5lIHdpdGggX2lzVVRDXHJcbiAgICAgICAgICAgIF9wZiA6IG51bGwsXHJcbiAgICAgICAgICAgIF9sYW5nIDogbnVsbCAgLy8gb3B0aW9uYWxcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyBjaGVjayBmb3Igbm9kZUpTXHJcbiAgICAgICAgaGFzTW9kdWxlID0gKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSxcclxuXHJcbiAgICAgICAgLy8gQVNQLk5FVCBqc29uIGRhdGUgZm9ybWF0IHJlZ2V4XHJcbiAgICAgICAgYXNwTmV0SnNvblJlZ2V4ID0gL15cXC8/RGF0ZVxcKChcXC0/XFxkKykvaSxcclxuICAgICAgICBhc3BOZXRUaW1lU3Bhbkpzb25SZWdleCA9IC8oXFwtKT8oPzooXFxkKilcXC4pPyhcXGQrKVxcOihcXGQrKSg/OlxcOihcXGQrKVxcLj8oXFxkezN9KT8pPy8sXHJcblxyXG4gICAgICAgIC8vIGZyb20gaHR0cDovL2RvY3MuY2xvc3VyZS1saWJyYXJ5Lmdvb2dsZWNvZGUuY29tL2dpdC9jbG9zdXJlX2dvb2dfZGF0ZV9kYXRlLmpzLnNvdXJjZS5odG1sXHJcbiAgICAgICAgLy8gc29tZXdoYXQgbW9yZSBpbiBsaW5lIHdpdGggNC40LjMuMiAyMDA0IHNwZWMsIGJ1dCBhbGxvd3MgZGVjaW1hbCBhbnl3aGVyZVxyXG4gICAgICAgIGlzb0R1cmF0aW9uUmVnZXggPSAvXigtKT9QKD86KD86KFswLTksLl0qKVkpPyg/OihbMC05LC5dKilNKT8oPzooWzAtOSwuXSopRCk/KD86VCg/OihbMC05LC5dKilIKT8oPzooWzAtOSwuXSopTSk/KD86KFswLTksLl0qKVMpPyk/fChbMC05LC5dKilXKSQvLFxyXG5cclxuICAgICAgICAvLyBmb3JtYXQgdG9rZW5zXHJcbiAgICAgICAgZm9ybWF0dGluZ1Rva2VucyA9IC8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhNb3xNTT9NP00/fERvfERERG98REQ/RD9EP3xkZGQ/ZD98ZG8/fHdbb3x3XT98V1tvfFddP3xRfFlZWVlZWXxZWVlZWXxZWVlZfFlZfGdnKGdnZz8pP3xHRyhHR0c/KT98ZXxFfGF8QXxoaD98SEg/fG1tP3xzcz98U3sxLDR9fFh8eno/fFpaP3wuKS9nLFxyXG4gICAgICAgIGxvY2FsRm9ybWF0dGluZ1Rva2VucyA9IC8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhMVHxMTD9MP0w/fGx7MSw0fSkvZyxcclxuXHJcbiAgICAgICAgLy8gcGFyc2luZyB0b2tlbiByZWdleGVzXHJcbiAgICAgICAgcGFyc2VUb2tlbk9uZU9yVHdvRGlnaXRzID0gL1xcZFxcZD8vLCAvLyAwIC0gOTlcclxuICAgICAgICBwYXJzZVRva2VuT25lVG9UaHJlZURpZ2l0cyA9IC9cXGR7MSwzfS8sIC8vIDAgLSA5OTlcclxuICAgICAgICBwYXJzZVRva2VuT25lVG9Gb3VyRGlnaXRzID0gL1xcZHsxLDR9LywgLy8gMCAtIDk5OTlcclxuICAgICAgICBwYXJzZVRva2VuT25lVG9TaXhEaWdpdHMgPSAvWytcXC1dP1xcZHsxLDZ9LywgLy8gLTk5OSw5OTkgLSA5OTksOTk5XHJcbiAgICAgICAgcGFyc2VUb2tlbkRpZ2l0cyA9IC9cXGQrLywgLy8gbm9uemVybyBudW1iZXIgb2YgZGlnaXRzXHJcbiAgICAgICAgcGFyc2VUb2tlbldvcmQgPSAvWzAtOV0qWydhLXpcXHUwMEEwLVxcdTA1RkZcXHUwNzAwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdK3xbXFx1MDYwMC1cXHUwNkZGXFwvXSsoXFxzKj9bXFx1MDYwMC1cXHUwNkZGXSspezEsMn0vaSwgLy8gYW55IHdvcmQgKG9yIHR3bykgY2hhcmFjdGVycyBvciBudW1iZXJzIGluY2x1ZGluZyB0d28vdGhyZWUgd29yZCBtb250aCBpbiBhcmFiaWMuXHJcbiAgICAgICAgcGFyc2VUb2tlblRpbWV6b25lID0gL1p8W1xcK1xcLV1cXGRcXGQ6P1xcZFxcZC9naSwgLy8gKzAwOjAwIC0wMDowMCArMDAwMCAtMDAwMCBvciBaXHJcbiAgICAgICAgcGFyc2VUb2tlblQgPSAvVC9pLCAvLyBUIChJU08gc2VwYXJhdG9yKVxyXG4gICAgICAgIHBhcnNlVG9rZW5UaW1lc3RhbXBNcyA9IC9bXFwrXFwtXT9cXGQrKFxcLlxcZHsxLDN9KT8vLCAvLyAxMjM0NTY3ODkgMTIzNDU2Nzg5LjEyM1xyXG4gICAgICAgIHBhcnNlVG9rZW5PcmRpbmFsID0gL1xcZHsxLDJ9LyxcclxuXHJcbiAgICAgICAgLy9zdHJpY3QgcGFyc2luZyByZWdleGVzXHJcbiAgICAgICAgcGFyc2VUb2tlbk9uZURpZ2l0ID0gL1xcZC8sIC8vIDAgLSA5XHJcbiAgICAgICAgcGFyc2VUb2tlblR3b0RpZ2l0cyA9IC9cXGRcXGQvLCAvLyAwMCAtIDk5XHJcbiAgICAgICAgcGFyc2VUb2tlblRocmVlRGlnaXRzID0gL1xcZHszfS8sIC8vIDAwMCAtIDk5OVxyXG4gICAgICAgIHBhcnNlVG9rZW5Gb3VyRGlnaXRzID0gL1xcZHs0fS8sIC8vIDAwMDAgLSA5OTk5XHJcbiAgICAgICAgcGFyc2VUb2tlblNpeERpZ2l0cyA9IC9bKy1dP1xcZHs2fS8sIC8vIC05OTksOTk5IC0gOTk5LDk5OVxyXG4gICAgICAgIHBhcnNlVG9rZW5TaWduZWROdW1iZXIgPSAvWystXT9cXGQrLywgLy8gLWluZiAtIGluZlxyXG5cclxuICAgICAgICAvLyBpc28gODYwMSByZWdleFxyXG4gICAgICAgIC8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxyXG4gICAgICAgIGlzb1JlZ2V4ID0gL15cXHMqKD86WystXVxcZHs2fXxcXGR7NH0pLSg/OihcXGRcXGQtXFxkXFxkKXwoV1xcZFxcZCQpfChXXFxkXFxkLVxcZCl8KFxcZFxcZFxcZCkpKChUfCApKFxcZFxcZCg6XFxkXFxkKDpcXGRcXGQoXFwuXFxkKyk/KT8pPyk/KFtcXCtcXC1dXFxkXFxkKD86Oj9cXGRcXGQpP3xcXHMqWik/KT8kLyxcclxuXHJcbiAgICAgICAgaXNvRm9ybWF0ID0gJ1lZWVktTU0tRERUSEg6bW06c3NaJyxcclxuXHJcbiAgICAgICAgaXNvRGF0ZXMgPSBbXHJcbiAgICAgICAgICAgIFsnWVlZWVlZLU1NLUREJywgL1srLV1cXGR7Nn0tXFxkezJ9LVxcZHsyfS9dLFxyXG4gICAgICAgICAgICBbJ1lZWVktTU0tREQnLCAvXFxkezR9LVxcZHsyfS1cXGR7Mn0vXSxcclxuICAgICAgICAgICAgWydHR0dHLVtXXVdXLUUnLCAvXFxkezR9LVdcXGR7Mn0tXFxkL10sXHJcbiAgICAgICAgICAgIFsnR0dHRy1bV11XVycsIC9cXGR7NH0tV1xcZHsyfS9dLFxyXG4gICAgICAgICAgICBbJ1lZWVktREREJywgL1xcZHs0fS1cXGR7M30vXVxyXG4gICAgICAgIF0sXHJcblxyXG4gICAgICAgIC8vIGlzbyB0aW1lIGZvcm1hdHMgYW5kIHJlZ2V4ZXNcclxuICAgICAgICBpc29UaW1lcyA9IFtcclxuICAgICAgICAgICAgWydISDptbTpzcy5TU1NTJywgLyhUfCApXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGQrL10sXHJcbiAgICAgICAgICAgIFsnSEg6bW06c3MnLCAvKFR8IClcXGRcXGQ6XFxkXFxkOlxcZFxcZC9dLFxyXG4gICAgICAgICAgICBbJ0hIOm1tJywgLyhUfCApXFxkXFxkOlxcZFxcZC9dLFxyXG4gICAgICAgICAgICBbJ0hIJywgLyhUfCApXFxkXFxkL11cclxuICAgICAgICBdLFxyXG5cclxuICAgICAgICAvLyB0aW1lem9uZSBjaHVua2VyIFwiKzEwOjAwXCIgPiBbXCIxMFwiLCBcIjAwXCJdIG9yIFwiLTE1MzBcIiA+IFtcIi0xNVwiLCBcIjMwXCJdXHJcbiAgICAgICAgcGFyc2VUaW1lem9uZUNodW5rZXIgPSAvKFtcXCtcXC1dfFxcZFxcZCkvZ2ksXHJcblxyXG4gICAgICAgIC8vIGdldHRlciBhbmQgc2V0dGVyIG5hbWVzXHJcbiAgICAgICAgcHJveHlHZXR0ZXJzQW5kU2V0dGVycyA9ICdEYXRlfEhvdXJzfE1pbnV0ZXN8U2Vjb25kc3xNaWxsaXNlY29uZHMnLnNwbGl0KCd8JyksXHJcbiAgICAgICAgdW5pdE1pbGxpc2Vjb25kRmFjdG9ycyA9IHtcclxuICAgICAgICAgICAgJ01pbGxpc2Vjb25kcycgOiAxLFxyXG4gICAgICAgICAgICAnU2Vjb25kcycgOiAxZTMsXHJcbiAgICAgICAgICAgICdNaW51dGVzJyA6IDZlNCxcclxuICAgICAgICAgICAgJ0hvdXJzJyA6IDM2ZTUsXHJcbiAgICAgICAgICAgICdEYXlzJyA6IDg2NGU1LFxyXG4gICAgICAgICAgICAnTW9udGhzJyA6IDI1OTJlNixcclxuICAgICAgICAgICAgJ1llYXJzJyA6IDMxNTM2ZTZcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB1bml0QWxpYXNlcyA9IHtcclxuICAgICAgICAgICAgbXMgOiAnbWlsbGlzZWNvbmQnLFxyXG4gICAgICAgICAgICBzIDogJ3NlY29uZCcsXHJcbiAgICAgICAgICAgIG0gOiAnbWludXRlJyxcclxuICAgICAgICAgICAgaCA6ICdob3VyJyxcclxuICAgICAgICAgICAgZCA6ICdkYXknLFxyXG4gICAgICAgICAgICBEIDogJ2RhdGUnLFxyXG4gICAgICAgICAgICB3IDogJ3dlZWsnLFxyXG4gICAgICAgICAgICBXIDogJ2lzb1dlZWsnLFxyXG4gICAgICAgICAgICBNIDogJ21vbnRoJyxcclxuICAgICAgICAgICAgUSA6ICdxdWFydGVyJyxcclxuICAgICAgICAgICAgeSA6ICd5ZWFyJyxcclxuICAgICAgICAgICAgREREIDogJ2RheU9mWWVhcicsXHJcbiAgICAgICAgICAgIGUgOiAnd2Vla2RheScsXHJcbiAgICAgICAgICAgIEUgOiAnaXNvV2Vla2RheScsXHJcbiAgICAgICAgICAgIGdnOiAnd2Vla1llYXInLFxyXG4gICAgICAgICAgICBHRzogJ2lzb1dlZWtZZWFyJ1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGNhbWVsRnVuY3Rpb25zID0ge1xyXG4gICAgICAgICAgICBkYXlvZnllYXIgOiAnZGF5T2ZZZWFyJyxcclxuICAgICAgICAgICAgaXNvd2Vla2RheSA6ICdpc29XZWVrZGF5JyxcclxuICAgICAgICAgICAgaXNvd2VlayA6ICdpc29XZWVrJyxcclxuICAgICAgICAgICAgd2Vla3llYXIgOiAnd2Vla1llYXInLFxyXG4gICAgICAgICAgICBpc293ZWVreWVhciA6ICdpc29XZWVrWWVhcidcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyBmb3JtYXQgZnVuY3Rpb24gc3RyaW5nc1xyXG4gICAgICAgIGZvcm1hdEZ1bmN0aW9ucyA9IHt9LFxyXG5cclxuICAgICAgICAvLyBkZWZhdWx0IHJlbGF0aXZlIHRpbWUgdGhyZXNob2xkc1xyXG4gICAgICAgIHJlbGF0aXZlVGltZVRocmVzaG9sZHMgPSB7XHJcbiAgICAgICAgICBzOiA0NSwgICAvL3NlY29uZHMgdG8gbWludXRlc1xyXG4gICAgICAgICAgbTogNDUsICAgLy9taW51dGVzIHRvIGhvdXJzXHJcbiAgICAgICAgICBoOiAyMiwgICAvL2hvdXJzIHRvIGRheXNcclxuICAgICAgICAgIGRkOiAyNSwgIC8vZGF5cyB0byBtb250aCAobW9udGggPT0gMSlcclxuICAgICAgICAgIGRtOiA0NSwgIC8vZGF5cyB0byBtb250aHMgKG1vbnRocyA+IDEpXHJcbiAgICAgICAgICBkeTogMzQ1ICAvL2RheXMgdG8geWVhclxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIHRva2VucyB0byBvcmRpbmFsaXplIGFuZCBwYWRcclxuICAgICAgICBvcmRpbmFsaXplVG9rZW5zID0gJ0RERCB3IFcgTSBEIGQnLnNwbGl0KCcgJyksXHJcbiAgICAgICAgcGFkZGVkVG9rZW5zID0gJ00gRCBIIGggbSBzIHcgVycuc3BsaXQoJyAnKSxcclxuXHJcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIE0gICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tb250aCgpICsgMTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgTU1NICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5tb250aHNTaG9ydCh0aGlzLCBmb3JtYXQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBNTU1NIDogZnVuY3Rpb24gKGZvcm1hdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLm1vbnRocyh0aGlzLCBmb3JtYXQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBEICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBEREQgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF5T2ZZZWFyKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGQgICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYXkoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGQgICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS53ZWVrZGF5c01pbih0aGlzLCBmb3JtYXQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBkZGQgIDogZnVuY3Rpb24gKGZvcm1hdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLndlZWtkYXlzU2hvcnQodGhpcywgZm9ybWF0KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGRkZCA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS53ZWVrZGF5cyh0aGlzLCBmb3JtYXQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB3ICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2VlaygpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBXICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNvV2VlaygpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBZWSAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLnllYXIoKSAlIDEwMCwgMik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFlZWVkgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMueWVhcigpLCA0KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgWVlZWVkgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMueWVhcigpLCA1KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgWVlZWVlZIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLnllYXIoKSwgc2lnbiA9IHkgPj0gMCA/ICcrJyA6ICctJztcclxuICAgICAgICAgICAgICAgIHJldHVybiBzaWduICsgbGVmdFplcm9GaWxsKE1hdGguYWJzKHkpLCA2KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ2cgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy53ZWVrWWVhcigpICUgMTAwLCAyKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ2dnZyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy53ZWVrWWVhcigpLCA0KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ2dnZ2cgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMud2Vla1llYXIoKSwgNSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdHICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMuaXNvV2Vla1llYXIoKSAlIDEwMCwgMik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdHR0cgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMuaXNvV2Vla1llYXIoKSwgNCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdHR0dHIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLmlzb1dlZWtZZWFyKCksIDUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2Vla2RheSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBFIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNvV2Vla2RheSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIHRydWUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBBICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIGZhbHNlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgSCAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhvdXJzKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGggICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ob3VycygpICUgMTIgfHwgMTI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG0gICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5taW51dGVzKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHMgICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZWNvbmRzKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFMgICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9JbnQodGhpcy5taWxsaXNlY29uZHMoKSAvIDEwMCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFNTICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRvSW50KHRoaXMubWlsbGlzZWNvbmRzKCkgLyAxMCksIDIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBTU1MgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLm1pbGxpc2Vjb25kcygpLCAzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgU1NTUyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5taWxsaXNlY29uZHMoKSwgMyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFogICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IC10aGlzLnpvbmUoKSxcclxuICAgICAgICAgICAgICAgICAgICBiID0gXCIrXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoYSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICAgICAgICAgICAgYiA9IFwiLVwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGIgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSAvIDYwKSwgMikgKyBcIjpcIiArIGxlZnRaZXJvRmlsbCh0b0ludChhKSAlIDYwLCAyKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgWlogICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gLXRoaXMuem9uZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgIGIgPSBcIitcIjtcclxuICAgICAgICAgICAgICAgIGlmIChhIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGEgPSAtYTtcclxuICAgICAgICAgICAgICAgICAgICBiID0gXCItXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYiArIGxlZnRaZXJvRmlsbCh0b0ludChhIC8gNjApLCAyKSArIGxlZnRaZXJvRmlsbCh0b0ludChhKSAlIDYwLCAyKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeiA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnpvbmVBYmJyKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHp6IDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuem9uZU5hbWUoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgWCAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnVuaXgoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnF1YXJ0ZXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGxpc3RzID0gWydtb250aHMnLCAnbW9udGhzU2hvcnQnLCAnd2Vla2RheXMnLCAnd2Vla2RheXNTaG9ydCcsICd3ZWVrZGF5c01pbiddO1xyXG5cclxuICAgIC8vIFBpY2sgdGhlIGZpcnN0IGRlZmluZWQgb2YgdHdvIG9yIHRocmVlIGFyZ3VtZW50cy4gZGZsIGNvbWVzIGZyb21cclxuICAgIC8vIGRlZmF1bHQuXHJcbiAgICBmdW5jdGlvbiBkZmwoYSwgYiwgYykge1xyXG4gICAgICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjYXNlIDI6IHJldHVybiBhICE9IG51bGwgPyBhIDogYjtcclxuICAgICAgICAgICAgY2FzZSAzOiByZXR1cm4gYSAhPSBudWxsID8gYSA6IGIgIT0gbnVsbCA/IGIgOiBjO1xyXG4gICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoXCJJbXBsZW1lbnQgbWVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlZmF1bHRQYXJzaW5nRmxhZ3MoKSB7XHJcbiAgICAgICAgLy8gV2UgbmVlZCB0byBkZWVwIGNsb25lIHRoaXMgb2JqZWN0LCBhbmQgZXM1IHN0YW5kYXJkIGlzIG5vdCB2ZXJ5XHJcbiAgICAgICAgLy8gaGVscGZ1bC5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBlbXB0eSA6IGZhbHNlLFxyXG4gICAgICAgICAgICB1bnVzZWRUb2tlbnMgOiBbXSxcclxuICAgICAgICAgICAgdW51c2VkSW5wdXQgOiBbXSxcclxuICAgICAgICAgICAgb3ZlcmZsb3cgOiAtMixcclxuICAgICAgICAgICAgY2hhcnNMZWZ0T3ZlciA6IDAsXHJcbiAgICAgICAgICAgIG51bGxJbnB1dCA6IGZhbHNlLFxyXG4gICAgICAgICAgICBpbnZhbGlkTW9udGggOiBudWxsLFxyXG4gICAgICAgICAgICBpbnZhbGlkRm9ybWF0IDogZmFsc2UsXHJcbiAgICAgICAgICAgIHVzZXJJbnZhbGlkYXRlZCA6IGZhbHNlLFxyXG4gICAgICAgICAgICBpc286IGZhbHNlXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZXByZWNhdGUobXNnLCBmbikge1xyXG4gICAgICAgIHZhciBmaXJzdFRpbWUgPSB0cnVlO1xyXG4gICAgICAgIGZ1bmN0aW9uIHByaW50TXNnKCkge1xyXG4gICAgICAgICAgICBpZiAobW9tZW50LnN1cHByZXNzRGVwcmVjYXRpb25XYXJuaW5ncyA9PT0gZmFsc2UgJiZcclxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uc29sZS53YXJuKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJEZXByZWNhdGlvbiB3YXJuaW5nOiBcIiArIG1zZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGV4dGVuZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChmaXJzdFRpbWUpIHtcclxuICAgICAgICAgICAgICAgIHByaW50TXNnKCk7XHJcbiAgICAgICAgICAgICAgICBmaXJzdFRpbWUgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICB9LCBmbik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFkVG9rZW4oZnVuYywgY291bnQpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbChmdW5jLmNhbGwodGhpcywgYSksIGNvdW50KTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gb3JkaW5hbGl6ZVRva2VuKGZ1bmMsIHBlcmlvZCkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkub3JkaW5hbChmdW5jLmNhbGwodGhpcywgYSksIHBlcmlvZCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZSAob3JkaW5hbGl6ZVRva2Vucy5sZW5ndGgpIHtcclxuICAgICAgICBpID0gb3JkaW5hbGl6ZVRva2Vucy5wb3AoKTtcclxuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1tpICsgJ28nXSA9IG9yZGluYWxpemVUb2tlbihmb3JtYXRUb2tlbkZ1bmN0aW9uc1tpXSwgaSk7XHJcbiAgICB9XHJcbiAgICB3aGlsZSAocGFkZGVkVG9rZW5zLmxlbmd0aCkge1xyXG4gICAgICAgIGkgPSBwYWRkZWRUb2tlbnMucG9wKCk7XHJcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbaSArIGldID0gcGFkVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnNbaV0sIDIpO1xyXG4gICAgfVxyXG4gICAgZm9ybWF0VG9rZW5GdW5jdGlvbnMuRERERCA9IHBhZFRva2VuKGZvcm1hdFRva2VuRnVuY3Rpb25zLkRERCwgMyk7XHJcblxyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBDb25zdHJ1Y3RvcnNcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgICBmdW5jdGlvbiBMYW5ndWFnZSgpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9tZW50IHByb3RvdHlwZSBvYmplY3RcclxuICAgIGZ1bmN0aW9uIE1vbWVudChjb25maWcpIHtcclxuICAgICAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XHJcbiAgICAgICAgZXh0ZW5kKHRoaXMsIGNvbmZpZyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRHVyYXRpb24gQ29uc3RydWN0b3JcclxuICAgIGZ1bmN0aW9uIER1cmF0aW9uKGR1cmF0aW9uKSB7XHJcbiAgICAgICAgdmFyIG5vcm1hbGl6ZWRJbnB1dCA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKGR1cmF0aW9uKSxcclxuICAgICAgICAgICAgeWVhcnMgPSBub3JtYWxpemVkSW5wdXQueWVhciB8fCAwLFxyXG4gICAgICAgICAgICBxdWFydGVycyA9IG5vcm1hbGl6ZWRJbnB1dC5xdWFydGVyIHx8IDAsXHJcbiAgICAgICAgICAgIG1vbnRocyA9IG5vcm1hbGl6ZWRJbnB1dC5tb250aCB8fCAwLFxyXG4gICAgICAgICAgICB3ZWVrcyA9IG5vcm1hbGl6ZWRJbnB1dC53ZWVrIHx8IDAsXHJcbiAgICAgICAgICAgIGRheXMgPSBub3JtYWxpemVkSW5wdXQuZGF5IHx8IDAsXHJcbiAgICAgICAgICAgIGhvdXJzID0gbm9ybWFsaXplZElucHV0LmhvdXIgfHwgMCxcclxuICAgICAgICAgICAgbWludXRlcyA9IG5vcm1hbGl6ZWRJbnB1dC5taW51dGUgfHwgMCxcclxuICAgICAgICAgICAgc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5zZWNvbmQgfHwgMCxcclxuICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gbm9ybWFsaXplZElucHV0Lm1pbGxpc2Vjb25kIHx8IDA7XHJcblxyXG4gICAgICAgIC8vIHJlcHJlc2VudGF0aW9uIGZvciBkYXRlQWRkUmVtb3ZlXHJcbiAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzID0gK21pbGxpc2Vjb25kcyArXHJcbiAgICAgICAgICAgIHNlY29uZHMgKiAxZTMgKyAvLyAxMDAwXHJcbiAgICAgICAgICAgIG1pbnV0ZXMgKiA2ZTQgKyAvLyAxMDAwICogNjBcclxuICAgICAgICAgICAgaG91cnMgKiAzNmU1OyAvLyAxMDAwICogNjAgKiA2MFxyXG4gICAgICAgIC8vIEJlY2F1c2Ugb2YgZGF0ZUFkZFJlbW92ZSB0cmVhdHMgMjQgaG91cnMgYXMgZGlmZmVyZW50IGZyb20gYVxyXG4gICAgICAgIC8vIGRheSB3aGVuIHdvcmtpbmcgYXJvdW5kIERTVCwgd2UgbmVlZCB0byBzdG9yZSB0aGVtIHNlcGFyYXRlbHlcclxuICAgICAgICB0aGlzLl9kYXlzID0gK2RheXMgK1xyXG4gICAgICAgICAgICB3ZWVrcyAqIDc7XHJcbiAgICAgICAgLy8gSXQgaXMgaW1wb3NzaWJsZSB0cmFuc2xhdGUgbW9udGhzIGludG8gZGF5cyB3aXRob3V0IGtub3dpbmdcclxuICAgICAgICAvLyB3aGljaCBtb250aHMgeW91IGFyZSBhcmUgdGFsa2luZyBhYm91dCwgc28gd2UgaGF2ZSB0byBzdG9yZVxyXG4gICAgICAgIC8vIGl0IHNlcGFyYXRlbHkuXHJcbiAgICAgICAgdGhpcy5fbW9udGhzID0gK21vbnRocyArXHJcbiAgICAgICAgICAgIHF1YXJ0ZXJzICogMyArXHJcbiAgICAgICAgICAgIHllYXJzICogMTI7XHJcblxyXG4gICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5fYnViYmxlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIEhlbHBlcnNcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gZXh0ZW5kKGEsIGIpIHtcclxuICAgICAgICBmb3IgKHZhciBpIGluIGIpIHtcclxuICAgICAgICAgICAgaWYgKGIuaGFzT3duUHJvcGVydHkoaSkpIHtcclxuICAgICAgICAgICAgICAgIGFbaV0gPSBiW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYi5oYXNPd25Qcm9wZXJ0eShcInRvU3RyaW5nXCIpKSB7XHJcbiAgICAgICAgICAgIGEudG9TdHJpbmcgPSBiLnRvU3RyaW5nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGIuaGFzT3duUHJvcGVydHkoXCJ2YWx1ZU9mXCIpKSB7XHJcbiAgICAgICAgICAgIGEudmFsdWVPZiA9IGIudmFsdWVPZjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNsb25lTW9tZW50KG0pIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0ge30sIGk7XHJcbiAgICAgICAgZm9yIChpIGluIG0pIHtcclxuICAgICAgICAgICAgaWYgKG0uaGFzT3duUHJvcGVydHkoaSkgJiYgbW9tZW50UHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W2ldID0gbVtpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhYnNSb3VuZChudW1iZXIpIHtcclxuICAgICAgICBpZiAobnVtYmVyIDwgMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbGVmdCB6ZXJvIGZpbGwgYSBudW1iZXJcclxuICAgIC8vIHNlZSBodHRwOi8vanNwZXJmLmNvbS9sZWZ0LXplcm8tZmlsbGluZyBmb3IgcGVyZm9ybWFuY2UgY29tcGFyaXNvblxyXG4gICAgZnVuY3Rpb24gbGVmdFplcm9GaWxsKG51bWJlciwgdGFyZ2V0TGVuZ3RoLCBmb3JjZVNpZ24pIHtcclxuICAgICAgICB2YXIgb3V0cHV0ID0gJycgKyBNYXRoLmFicyhudW1iZXIpLFxyXG4gICAgICAgICAgICBzaWduID0gbnVtYmVyID49IDA7XHJcblxyXG4gICAgICAgIHdoaWxlIChvdXRwdXQubGVuZ3RoIDwgdGFyZ2V0TGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIG91dHB1dCA9ICcwJyArIG91dHB1dDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIChzaWduID8gKGZvcmNlU2lnbiA/ICcrJyA6ICcnKSA6ICctJykgKyBvdXRwdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBfLmFkZFRpbWUgYW5kIF8uc3VidHJhY3RUaW1lXHJcbiAgICBmdW5jdGlvbiBhZGRPclN1YnRyYWN0RHVyYXRpb25Gcm9tTW9tZW50KG1vbSwgZHVyYXRpb24sIGlzQWRkaW5nLCB1cGRhdGVPZmZzZXQpIHtcclxuICAgICAgICB2YXIgbWlsbGlzZWNvbmRzID0gZHVyYXRpb24uX21pbGxpc2Vjb25kcyxcclxuICAgICAgICAgICAgZGF5cyA9IGR1cmF0aW9uLl9kYXlzLFxyXG4gICAgICAgICAgICBtb250aHMgPSBkdXJhdGlvbi5fbW9udGhzO1xyXG4gICAgICAgIHVwZGF0ZU9mZnNldCA9IHVwZGF0ZU9mZnNldCA9PSBudWxsID8gdHJ1ZSA6IHVwZGF0ZU9mZnNldDtcclxuXHJcbiAgICAgICAgaWYgKG1pbGxpc2Vjb25kcykge1xyXG4gICAgICAgICAgICBtb20uX2Quc2V0VGltZSgrbW9tLl9kICsgbWlsbGlzZWNvbmRzICogaXNBZGRpbmcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF5cykge1xyXG4gICAgICAgICAgICByYXdTZXR0ZXIobW9tLCAnRGF0ZScsIHJhd0dldHRlcihtb20sICdEYXRlJykgKyBkYXlzICogaXNBZGRpbmcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobW9udGhzKSB7XHJcbiAgICAgICAgICAgIHJhd01vbnRoU2V0dGVyKG1vbSwgcmF3R2V0dGVyKG1vbSwgJ01vbnRoJykgKyBtb250aHMgKiBpc0FkZGluZyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh1cGRhdGVPZmZzZXQpIHtcclxuICAgICAgICAgICAgbW9tZW50LnVwZGF0ZU9mZnNldChtb20sIGRheXMgfHwgbW9udGhzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2hlY2sgaWYgaXMgYW4gYXJyYXlcclxuICAgIGZ1bmN0aW9uIGlzQXJyYXkoaW5wdXQpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc0RhdGUoaW5wdXQpIHtcclxuICAgICAgICByZXR1cm4gIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IERhdGVdJyB8fFxyXG4gICAgICAgICAgICAgICAgaW5wdXQgaW5zdGFuY2VvZiBEYXRlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbXBhcmUgdHdvIGFycmF5cywgcmV0dXJuIHRoZSBudW1iZXIgb2YgZGlmZmVyZW5jZXNcclxuICAgIGZ1bmN0aW9uIGNvbXBhcmVBcnJheXMoYXJyYXkxLCBhcnJheTIsIGRvbnRDb252ZXJ0KSB7XHJcbiAgICAgICAgdmFyIGxlbiA9IE1hdGgubWluKGFycmF5MS5sZW5ndGgsIGFycmF5Mi5sZW5ndGgpLFxyXG4gICAgICAgICAgICBsZW5ndGhEaWZmID0gTWF0aC5hYnMoYXJyYXkxLmxlbmd0aCAtIGFycmF5Mi5sZW5ndGgpLFxyXG4gICAgICAgICAgICBkaWZmcyA9IDAsXHJcbiAgICAgICAgICAgIGk7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICgoZG9udENvbnZlcnQgJiYgYXJyYXkxW2ldICE9PSBhcnJheTJbaV0pIHx8XHJcbiAgICAgICAgICAgICAgICAoIWRvbnRDb252ZXJ0ICYmIHRvSW50KGFycmF5MVtpXSkgIT09IHRvSW50KGFycmF5MltpXSkpKSB7XHJcbiAgICAgICAgICAgICAgICBkaWZmcysrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkaWZmcyArIGxlbmd0aERpZmY7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplVW5pdHModW5pdHMpIHtcclxuICAgICAgICBpZiAodW5pdHMpIHtcclxuICAgICAgICAgICAgdmFyIGxvd2VyZWQgPSB1bml0cy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyguKXMkLywgJyQxJyk7XHJcbiAgICAgICAgICAgIHVuaXRzID0gdW5pdEFsaWFzZXNbdW5pdHNdIHx8IGNhbWVsRnVuY3Rpb25zW2xvd2VyZWRdIHx8IGxvd2VyZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1bml0cztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBub3JtYWxpemVPYmplY3RVbml0cyhpbnB1dE9iamVjdCkge1xyXG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSB7fSxcclxuICAgICAgICAgICAgbm9ybWFsaXplZFByb3AsXHJcbiAgICAgICAgICAgIHByb3A7XHJcblxyXG4gICAgICAgIGZvciAocHJvcCBpbiBpbnB1dE9iamVjdCkge1xyXG4gICAgICAgICAgICBpZiAoaW5wdXRPYmplY3QuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wID0gbm9ybWFsaXplVW5pdHMocHJvcCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9ybWFsaXplZFByb3ApIHtcclxuICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkSW5wdXRbbm9ybWFsaXplZFByb3BdID0gaW5wdXRPYmplY3RbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBub3JtYWxpemVkSW5wdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZUxpc3QoZmllbGQpIHtcclxuICAgICAgICB2YXIgY291bnQsIHNldHRlcjtcclxuXHJcbiAgICAgICAgaWYgKGZpZWxkLmluZGV4T2YoJ3dlZWsnKSA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb3VudCA9IDc7XHJcbiAgICAgICAgICAgIHNldHRlciA9ICdkYXknO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChmaWVsZC5pbmRleE9mKCdtb250aCcpID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvdW50ID0gMTI7XHJcbiAgICAgICAgICAgIHNldHRlciA9ICdtb250aCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtb21lbnRbZmllbGRdID0gZnVuY3Rpb24gKGZvcm1hdCwgaW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGksIGdldHRlcixcclxuICAgICAgICAgICAgICAgIG1ldGhvZCA9IG1vbWVudC5mbi5fbGFuZ1tmaWVsZF0sXHJcbiAgICAgICAgICAgICAgICByZXN1bHRzID0gW107XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgICAgIGluZGV4ID0gZm9ybWF0O1xyXG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZXR0ZXIgPSBmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG0gPSBtb21lbnQoKS51dGMoKS5zZXQoc2V0dGVyLCBpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtZXRob2QuY2FsbChtb21lbnQuZm4uX2xhbmcsIG0sIGZvcm1hdCB8fCAnJyk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoaW5kZXggIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldHRlcihpbmRleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChnZXR0ZXIoaSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRvSW50KGFyZ3VtZW50Rm9yQ29lcmNpb24pIHtcclxuICAgICAgICB2YXIgY29lcmNlZE51bWJlciA9ICthcmd1bWVudEZvckNvZXJjaW9uLFxyXG4gICAgICAgICAgICB2YWx1ZSA9IDA7XHJcblxyXG4gICAgICAgIGlmIChjb2VyY2VkTnVtYmVyICE9PSAwICYmIGlzRmluaXRlKGNvZXJjZWROdW1iZXIpKSB7XHJcbiAgICAgICAgICAgIGlmIChjb2VyY2VkTnVtYmVyID49IDApIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gTWF0aC5mbG9vcihjb2VyY2VkTnVtYmVyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gTWF0aC5jZWlsKGNvZXJjZWROdW1iZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGF5c0luTW9udGgoeWVhciwgbW9udGgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGggKyAxLCAwKSkuZ2V0VVRDRGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHdlZWtzSW5ZZWFyKHllYXIsIGRvdywgZG95KSB7XHJcbiAgICAgICAgcmV0dXJuIHdlZWtPZlllYXIobW9tZW50KFt5ZWFyLCAxMSwgMzEgKyBkb3cgLSBkb3ldKSwgZG93LCBkb3kpLndlZWs7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGF5c0luWWVhcih5ZWFyKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzTGVhcFllYXIoeWVhcikgPyAzNjYgOiAzNjU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNMZWFwWWVhcih5ZWFyKSB7XHJcbiAgICAgICAgcmV0dXJuICh5ZWFyICUgNCA9PT0gMCAmJiB5ZWFyICUgMTAwICE9PSAwKSB8fCB5ZWFyICUgNDAwID09PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNoZWNrT3ZlcmZsb3cobSkge1xyXG4gICAgICAgIHZhciBvdmVyZmxvdztcclxuICAgICAgICBpZiAobS5fYSAmJiBtLl9wZi5vdmVyZmxvdyA9PT0gLTIpIHtcclxuICAgICAgICAgICAgb3ZlcmZsb3cgPVxyXG4gICAgICAgICAgICAgICAgbS5fYVtNT05USF0gPCAwIHx8IG0uX2FbTU9OVEhdID4gMTEgPyBNT05USCA6XHJcbiAgICAgICAgICAgICAgICBtLl9hW0RBVEVdIDwgMSB8fCBtLl9hW0RBVEVdID4gZGF5c0luTW9udGgobS5fYVtZRUFSXSwgbS5fYVtNT05USF0pID8gREFURSA6XHJcbiAgICAgICAgICAgICAgICBtLl9hW0hPVVJdIDwgMCB8fCBtLl9hW0hPVVJdID4gMjMgPyBIT1VSIDpcclxuICAgICAgICAgICAgICAgIG0uX2FbTUlOVVRFXSA8IDAgfHwgbS5fYVtNSU5VVEVdID4gNTkgPyBNSU5VVEUgOlxyXG4gICAgICAgICAgICAgICAgbS5fYVtTRUNPTkRdIDwgMCB8fCBtLl9hW1NFQ09ORF0gPiA1OSA/IFNFQ09ORCA6XHJcbiAgICAgICAgICAgICAgICBtLl9hW01JTExJU0VDT05EXSA8IDAgfHwgbS5fYVtNSUxMSVNFQ09ORF0gPiA5OTkgPyBNSUxMSVNFQ09ORCA6XHJcbiAgICAgICAgICAgICAgICAtMTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtLl9wZi5fb3ZlcmZsb3dEYXlPZlllYXIgJiYgKG92ZXJmbG93IDwgWUVBUiB8fCBvdmVyZmxvdyA+IERBVEUpKSB7XHJcbiAgICAgICAgICAgICAgICBvdmVyZmxvdyA9IERBVEU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG0uX3BmLm92ZXJmbG93ID0gb3ZlcmZsb3c7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzVmFsaWQobSkge1xyXG4gICAgICAgIGlmIChtLl9pc1ZhbGlkID09IG51bGwpIHtcclxuICAgICAgICAgICAgbS5faXNWYWxpZCA9ICFpc05hTihtLl9kLmdldFRpbWUoKSkgJiZcclxuICAgICAgICAgICAgICAgIG0uX3BmLm92ZXJmbG93IDwgMCAmJlxyXG4gICAgICAgICAgICAgICAgIW0uX3BmLmVtcHR5ICYmXHJcbiAgICAgICAgICAgICAgICAhbS5fcGYuaW52YWxpZE1vbnRoICYmXHJcbiAgICAgICAgICAgICAgICAhbS5fcGYubnVsbElucHV0ICYmXHJcbiAgICAgICAgICAgICAgICAhbS5fcGYuaW52YWxpZEZvcm1hdCAmJlxyXG4gICAgICAgICAgICAgICAgIW0uX3BmLnVzZXJJbnZhbGlkYXRlZDtcclxuXHJcbiAgICAgICAgICAgIGlmIChtLl9zdHJpY3QpIHtcclxuICAgICAgICAgICAgICAgIG0uX2lzVmFsaWQgPSBtLl9pc1ZhbGlkICYmXHJcbiAgICAgICAgICAgICAgICAgICAgbS5fcGYuY2hhcnNMZWZ0T3ZlciA9PT0gMCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIG0uX3BmLnVudXNlZFRva2Vucy5sZW5ndGggPT09IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG0uX2lzVmFsaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplTGFuZ3VhZ2Uoa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIGtleSA/IGtleS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJ18nLCAnLScpIDoga2V5O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJldHVybiBhIG1vbWVudCBmcm9tIGlucHV0LCB0aGF0IGlzIGxvY2FsL3V0Yy96b25lIGVxdWl2YWxlbnQgdG8gbW9kZWwuXHJcbiAgICBmdW5jdGlvbiBtYWtlQXMoaW5wdXQsIG1vZGVsKSB7XHJcbiAgICAgICAgcmV0dXJuIG1vZGVsLl9pc1VUQyA/IG1vbWVudChpbnB1dCkuem9uZShtb2RlbC5fb2Zmc2V0IHx8IDApIDpcclxuICAgICAgICAgICAgbW9tZW50KGlucHV0KS5sb2NhbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBMYW5ndWFnZXNcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgZXh0ZW5kKExhbmd1YWdlLnByb3RvdHlwZSwge1xyXG5cclxuICAgICAgICBzZXQgOiBmdW5jdGlvbiAoY29uZmlnKSB7XHJcbiAgICAgICAgICAgIHZhciBwcm9wLCBpO1xyXG4gICAgICAgICAgICBmb3IgKGkgaW4gY29uZmlnKSB7XHJcbiAgICAgICAgICAgICAgICBwcm9wID0gY29uZmlnW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9wID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tpXSA9IHByb3A7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbJ18nICsgaV0gPSBwcm9wO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX21vbnRocyA6IFwiSmFudWFyeV9GZWJydWFyeV9NYXJjaF9BcHJpbF9NYXlfSnVuZV9KdWx5X0F1Z3VzdF9TZXB0ZW1iZXJfT2N0b2Jlcl9Ob3ZlbWJlcl9EZWNlbWJlclwiLnNwbGl0KFwiX1wiKSxcclxuICAgICAgICBtb250aHMgOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzW20ubW9udGgoKV07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX21vbnRoc1Nob3J0IDogXCJKYW5fRmViX01hcl9BcHJfTWF5X0p1bl9KdWxfQXVnX1NlcF9PY3RfTm92X0RlY1wiLnNwbGl0KFwiX1wiKSxcclxuICAgICAgICBtb250aHNTaG9ydCA6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTaG9ydFttLm1vbnRoKCldO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG1vbnRoc1BhcnNlIDogZnVuY3Rpb24gKG1vbnRoTmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgaSwgbW9tLCByZWdleDtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlID0gW107XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2VbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBtb20gPSBtb21lbnQudXRjKFsyMDAwLCBpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLm1vbnRocyhtb20sICcnKSArICd8XicgKyB0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gdGVzdCB0aGUgcmVnZXhcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tb250aHNQYXJzZVtpXS50ZXN0KG1vbnRoTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF93ZWVrZGF5cyA6IFwiU3VuZGF5X01vbmRheV9UdWVzZGF5X1dlZG5lc2RheV9UaHVyc2RheV9GcmlkYXlfU2F0dXJkYXlcIi5zcGxpdChcIl9cIiksXHJcbiAgICAgICAgd2Vla2RheXMgOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNbbS5kYXkoKV07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX3dlZWtkYXlzU2hvcnQgOiBcIlN1bl9Nb25fVHVlX1dlZF9UaHVfRnJpX1NhdFwiLnNwbGl0KFwiX1wiKSxcclxuICAgICAgICB3ZWVrZGF5c1Nob3J0IDogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRbbS5kYXkoKV07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX3dlZWtkYXlzTWluIDogXCJTdV9Nb19UdV9XZV9UaF9Gcl9TYVwiLnNwbGl0KFwiX1wiKSxcclxuICAgICAgICB3ZWVrZGF5c01pbiA6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblttLmRheSgpXTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB3ZWVrZGF5c1BhcnNlIDogZnVuY3Rpb24gKHdlZWtkYXlOYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBpLCBtb20sIHJlZ2V4O1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlID0gW107XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9tID0gbW9tZW50KFsyMDAwLCAxXSkuZGF5KGkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4ID0gJ14nICsgdGhpcy53ZWVrZGF5cyhtb20sICcnKSArICd8XicgKyB0aGlzLndlZWtkYXlzU2hvcnQobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c01pbihtb20sICcnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gdGVzdCB0aGUgcmVnZXhcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl93ZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfbG9uZ0RhdGVGb3JtYXQgOiB7XHJcbiAgICAgICAgICAgIExUIDogXCJoOm1tIEFcIixcclxuICAgICAgICAgICAgTCA6IFwiTU0vREQvWVlZWVwiLFxyXG4gICAgICAgICAgICBMTCA6IFwiTU1NTSBEIFlZWVlcIixcclxuICAgICAgICAgICAgTExMIDogXCJNTU1NIEQgWVlZWSBMVFwiLFxyXG4gICAgICAgICAgICBMTExMIDogXCJkZGRkLCBNTU1NIEQgWVlZWSBMVFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBsb25nRGF0ZUZvcm1hdCA6IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleV07XHJcbiAgICAgICAgICAgIGlmICghb3V0cHV0ICYmIHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleS50b1VwcGVyQ2FzZSgpXSkge1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldLnJlcGxhY2UoL01NTU18TU18RER8ZGRkZC9nLCBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbC5zbGljZSgxKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XSA9IG91dHB1dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzUE0gOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xyXG4gICAgICAgICAgICAvLyBVc2luZyBjaGFyQXQgc2hvdWxkIGJlIG1vcmUgY29tcGF0aWJsZS5cclxuICAgICAgICAgICAgcmV0dXJuICgoaW5wdXQgKyAnJykudG9Mb3dlckNhc2UoKS5jaGFyQXQoMCkgPT09ICdwJyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX21lcmlkaWVtUGFyc2UgOiAvW2FwXVxcLj9tP1xcLj8vaSxcclxuICAgICAgICBtZXJpZGllbSA6IGZ1bmN0aW9uIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xyXG4gICAgICAgICAgICBpZiAoaG91cnMgPiAxMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAncG0nIDogJ1BNJztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpc0xvd2VyID8gJ2FtJyA6ICdBTSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfY2FsZW5kYXIgOiB7XHJcbiAgICAgICAgICAgIHNhbWVEYXkgOiAnW1RvZGF5IGF0XSBMVCcsXHJcbiAgICAgICAgICAgIG5leHREYXkgOiAnW1RvbW9ycm93IGF0XSBMVCcsXHJcbiAgICAgICAgICAgIG5leHRXZWVrIDogJ2RkZGQgW2F0XSBMVCcsXHJcbiAgICAgICAgICAgIGxhc3REYXkgOiAnW1llc3RlcmRheSBhdF0gTFQnLFxyXG4gICAgICAgICAgICBsYXN0V2VlayA6ICdbTGFzdF0gZGRkZCBbYXRdIExUJyxcclxuICAgICAgICAgICAgc2FtZUVsc2UgOiAnTCdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNhbGVuZGFyIDogZnVuY3Rpb24gKGtleSwgbW9tKSB7XHJcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9jYWxlbmRhcltrZXldO1xyXG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIG91dHB1dCA9PT0gJ2Z1bmN0aW9uJyA/IG91dHB1dC5hcHBseShtb20pIDogb3V0cHV0O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9yZWxhdGl2ZVRpbWUgOiB7XHJcbiAgICAgICAgICAgIGZ1dHVyZSA6IFwiaW4gJXNcIixcclxuICAgICAgICAgICAgcGFzdCA6IFwiJXMgYWdvXCIsXHJcbiAgICAgICAgICAgIHMgOiBcImEgZmV3IHNlY29uZHNcIixcclxuICAgICAgICAgICAgbSA6IFwiYSBtaW51dGVcIixcclxuICAgICAgICAgICAgbW0gOiBcIiVkIG1pbnV0ZXNcIixcclxuICAgICAgICAgICAgaCA6IFwiYW4gaG91clwiLFxyXG4gICAgICAgICAgICBoaCA6IFwiJWQgaG91cnNcIixcclxuICAgICAgICAgICAgZCA6IFwiYSBkYXlcIixcclxuICAgICAgICAgICAgZGQgOiBcIiVkIGRheXNcIixcclxuICAgICAgICAgICAgTSA6IFwiYSBtb250aFwiLFxyXG4gICAgICAgICAgICBNTSA6IFwiJWQgbW9udGhzXCIsXHJcbiAgICAgICAgICAgIHkgOiBcImEgeWVhclwiLFxyXG4gICAgICAgICAgICB5eSA6IFwiJWQgeWVhcnNcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVsYXRpdmVUaW1lIDogZnVuY3Rpb24gKG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkge1xyXG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5fcmVsYXRpdmVUaW1lW3N0cmluZ107XHJcbiAgICAgICAgICAgIHJldHVybiAodHlwZW9mIG91dHB1dCA9PT0gJ2Z1bmN0aW9uJykgP1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0KG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkgOlxyXG4gICAgICAgICAgICAgICAgb3V0cHV0LnJlcGxhY2UoLyVkL2ksIG51bWJlcik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwYXN0RnV0dXJlIDogZnVuY3Rpb24gKGRpZmYsIG91dHB1dCkge1xyXG4gICAgICAgICAgICB2YXIgZm9ybWF0ID0gdGhpcy5fcmVsYXRpdmVUaW1lW2RpZmYgPiAwID8gJ2Z1dHVyZScgOiAncGFzdCddO1xyXG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGZvcm1hdCA9PT0gJ2Z1bmN0aW9uJyA/IGZvcm1hdChvdXRwdXQpIDogZm9ybWF0LnJlcGxhY2UoLyVzL2ksIG91dHB1dCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgb3JkaW5hbCA6IGZ1bmN0aW9uIChudW1iZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29yZGluYWwucmVwbGFjZShcIiVkXCIsIG51bWJlcik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfb3JkaW5hbCA6IFwiJWRcIixcclxuXHJcbiAgICAgICAgcHJlcGFyc2UgOiBmdW5jdGlvbiAoc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmc7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcG9zdGZvcm1hdCA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0cmluZztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB3ZWVrIDogZnVuY3Rpb24gKG1vbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2Vla09mWWVhcihtb20sIHRoaXMuX3dlZWsuZG93LCB0aGlzLl93ZWVrLmRveSkud2VlaztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfd2VlayA6IHtcclxuICAgICAgICAgICAgZG93IDogMCwgLy8gU3VuZGF5IGlzIHRoZSBmaXJzdCBkYXkgb2YgdGhlIHdlZWsuXHJcbiAgICAgICAgICAgIGRveSA6IDYgIC8vIFRoZSB3ZWVrIHRoYXQgY29udGFpbnMgSmFuIDFzdCBpcyB0aGUgZmlyc3Qgd2VlayBvZiB0aGUgeWVhci5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfaW52YWxpZERhdGU6ICdJbnZhbGlkIGRhdGUnLFxyXG4gICAgICAgIGludmFsaWREYXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbnZhbGlkRGF0ZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMb2FkcyBhIGxhbmd1YWdlIGRlZmluaXRpb24gaW50byB0aGUgYGxhbmd1YWdlc2AgY2FjaGUuICBUaGUgZnVuY3Rpb25cclxuICAgIC8vIHRha2VzIGEga2V5IGFuZCBvcHRpb25hbGx5IHZhbHVlcy4gIElmIG5vdCBpbiB0aGUgYnJvd3NlciBhbmQgbm8gdmFsdWVzXHJcbiAgICAvLyBhcmUgcHJvdmlkZWQsIGl0IHdpbGwgbG9hZCB0aGUgbGFuZ3VhZ2UgZmlsZSBtb2R1bGUuICBBcyBhIGNvbnZlbmllbmNlLFxyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBhbHNvIHJldHVybnMgdGhlIGxhbmd1YWdlIHZhbHVlcy5cclxuICAgIGZ1bmN0aW9uIGxvYWRMYW5nKGtleSwgdmFsdWVzKSB7XHJcbiAgICAgICAgdmFsdWVzLmFiYnIgPSBrZXk7XHJcbiAgICAgICAgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xyXG4gICAgICAgICAgICBsYW5ndWFnZXNba2V5XSA9IG5ldyBMYW5ndWFnZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsYW5ndWFnZXNba2V5XS5zZXQodmFsdWVzKTtcclxuICAgICAgICByZXR1cm4gbGFuZ3VhZ2VzW2tleV07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIGEgbGFuZ3VhZ2UgZnJvbSB0aGUgYGxhbmd1YWdlc2AgY2FjaGUuIE1vc3RseSB1c2VmdWwgaW4gdGVzdHMuXHJcbiAgICBmdW5jdGlvbiB1bmxvYWRMYW5nKGtleSkge1xyXG4gICAgICAgIGRlbGV0ZSBsYW5ndWFnZXNba2V5XTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEZXRlcm1pbmVzIHdoaWNoIGxhbmd1YWdlIGRlZmluaXRpb24gdG8gdXNlIGFuZCByZXR1cm5zIGl0LlxyXG4gICAgLy9cclxuICAgIC8vIFdpdGggbm8gcGFyYW1ldGVycywgaXQgd2lsbCByZXR1cm4gdGhlIGdsb2JhbCBsYW5ndWFnZS4gIElmIHlvdVxyXG4gICAgLy8gcGFzcyBpbiBhIGxhbmd1YWdlIGtleSwgc3VjaCBhcyAnZW4nLCBpdCB3aWxsIHJldHVybiB0aGVcclxuICAgIC8vIGRlZmluaXRpb24gZm9yICdlbicsIHNvIGxvbmcgYXMgJ2VuJyBoYXMgYWxyZWFkeSBiZWVuIGxvYWRlZCB1c2luZ1xyXG4gICAgLy8gbW9tZW50LmxhbmcuXHJcbiAgICBmdW5jdGlvbiBnZXRMYW5nRGVmaW5pdGlvbihrZXkpIHtcclxuICAgICAgICB2YXIgaSA9IDAsIGosIGxhbmcsIG5leHQsIHNwbGl0LFxyXG4gICAgICAgICAgICBnZXQgPSBmdW5jdGlvbiAoaykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsYW5ndWFnZXNba10gJiYgaGFzTW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZSgnLi9sYW5nLycgKyBrKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZXNba107XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICgha2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuZm4uX2xhbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWlzQXJyYXkoa2V5KSkge1xyXG4gICAgICAgICAgICAvL3Nob3J0LWNpcmN1aXQgZXZlcnl0aGluZyBlbHNlXHJcbiAgICAgICAgICAgIGxhbmcgPSBnZXQoa2V5KTtcclxuICAgICAgICAgICAgaWYgKGxhbmcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsYW5nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGtleSA9IFtrZXldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9waWNrIHRoZSBsYW5ndWFnZSBmcm9tIHRoZSBhcnJheVxyXG4gICAgICAgIC8vdHJ5IFsnZW4tYXUnLCAnZW4tZ2InXSBhcyAnZW4tYXUnLCAnZW4tZ2InLCAnZW4nLCBhcyBpbiBtb3ZlIHRocm91Z2ggdGhlIGxpc3QgdHJ5aW5nIGVhY2hcclxuICAgICAgICAvL3N1YnN0cmluZyBmcm9tIG1vc3Qgc3BlY2lmaWMgdG8gbGVhc3QsIGJ1dCBtb3ZlIHRvIHRoZSBuZXh0IGFycmF5IGl0ZW0gaWYgaXQncyBhIG1vcmUgc3BlY2lmaWMgdmFyaWFudCB0aGFuIHRoZSBjdXJyZW50IHJvb3RcclxuICAgICAgICB3aGlsZSAoaSA8IGtleS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgc3BsaXQgPSBub3JtYWxpemVMYW5ndWFnZShrZXlbaV0pLnNwbGl0KCctJyk7XHJcbiAgICAgICAgICAgIGogPSBzcGxpdC5sZW5ndGg7XHJcbiAgICAgICAgICAgIG5leHQgPSBub3JtYWxpemVMYW5ndWFnZShrZXlbaSArIDFdKTtcclxuICAgICAgICAgICAgbmV4dCA9IG5leHQgPyBuZXh0LnNwbGl0KCctJykgOiBudWxsO1xyXG4gICAgICAgICAgICB3aGlsZSAoaiA+IDApIHtcclxuICAgICAgICAgICAgICAgIGxhbmcgPSBnZXQoc3BsaXQuc2xpY2UoMCwgaikuam9pbignLScpKTtcclxuICAgICAgICAgICAgICAgIGlmIChsYW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxhbmc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobmV4dCAmJiBuZXh0Lmxlbmd0aCA+PSBqICYmIGNvbXBhcmVBcnJheXMoc3BsaXQsIG5leHQsIHRydWUpID49IGogLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy90aGUgbmV4dCBhcnJheSBpdGVtIGlzIGJldHRlciB0aGFuIGEgc2hhbGxvd2VyIHN1YnN0cmluZyBvZiB0aGlzIG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgai0tO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG1vbWVudC5mbi5fbGFuZztcclxuICAgIH1cclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgRm9ybWF0dGluZ1xyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGlucHV0KSB7XHJcbiAgICAgICAgaWYgKGlucHV0Lm1hdGNoKC9cXFtbXFxzXFxTXS8pKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9eXFxbfFxcXSQvZywgXCJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXFxcL2csIFwiXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpIHtcclxuICAgICAgICB2YXIgYXJyYXkgPSBmb3JtYXQubWF0Y2goZm9ybWF0dGluZ1Rva2VucyksIGksIGxlbmd0aDtcclxuXHJcbiAgICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGZvcm1hdFRva2VuRnVuY3Rpb25zW2FycmF5W2ldXSkge1xyXG4gICAgICAgICAgICAgICAgYXJyYXlbaV0gPSBmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhcnJheVtpXSA9IHJlbW92ZUZvcm1hdHRpbmdUb2tlbnMoYXJyYXlbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG1vbSkge1xyXG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gXCJcIjtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gYXJyYXlbaV0gaW5zdGFuY2VvZiBGdW5jdGlvbiA/IGFycmF5W2ldLmNhbGwobW9tLCBmb3JtYXQpIDogYXJyYXlbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZvcm1hdCBkYXRlIHVzaW5nIG5hdGl2ZSBkYXRlIG9iamVjdFxyXG4gICAgZnVuY3Rpb24gZm9ybWF0TW9tZW50KG0sIGZvcm1hdCkge1xyXG5cclxuICAgICAgICBpZiAoIW0uaXNWYWxpZCgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtLmxhbmcoKS5pbnZhbGlkRGF0ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9ybWF0ID0gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbS5sYW5nKCkpO1xyXG5cclxuICAgICAgICBpZiAoIWZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdKSB7XHJcbiAgICAgICAgICAgIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdID0gbWFrZUZvcm1hdEZ1bmN0aW9uKGZvcm1hdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0obSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbGFuZykge1xyXG4gICAgICAgIHZhciBpID0gNTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVwbGFjZUxvbmdEYXRlRm9ybWF0VG9rZW5zKGlucHV0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBsYW5nLmxvbmdEYXRlRm9ybWF0KGlucHV0KSB8fCBpbnB1dDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxvY2FsRm9ybWF0dGluZ1Rva2Vucy5sYXN0SW5kZXggPSAwO1xyXG4gICAgICAgIHdoaWxlIChpID49IDAgJiYgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLnRlc3QoZm9ybWF0KSkge1xyXG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZShsb2NhbEZvcm1hdHRpbmdUb2tlbnMsIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2Vucyk7XHJcbiAgICAgICAgICAgIGxvY2FsRm9ybWF0dGluZ1Rva2Vucy5sYXN0SW5kZXggPSAwO1xyXG4gICAgICAgICAgICBpIC09IDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZm9ybWF0O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgUGFyc2luZ1xyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgICAvLyBnZXQgdGhlIHJlZ2V4IHRvIGZpbmQgdGhlIG5leHQgdG9rZW5cclxuICAgIGZ1bmN0aW9uIGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIGEsIHN0cmljdCA9IGNvbmZpZy5fc3RyaWN0O1xyXG4gICAgICAgIHN3aXRjaCAodG9rZW4pIHtcclxuICAgICAgICBjYXNlICdRJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5PbmVEaWdpdDtcclxuICAgICAgICBjYXNlICdEREREJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaHJlZURpZ2l0cztcclxuICAgICAgICBjYXNlICdZWVlZJzpcclxuICAgICAgICBjYXNlICdHR0dHJzpcclxuICAgICAgICBjYXNlICdnZ2dnJzpcclxuICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IHBhcnNlVG9rZW5Gb3VyRGlnaXRzIDogcGFyc2VUb2tlbk9uZVRvRm91ckRpZ2l0cztcclxuICAgICAgICBjYXNlICdZJzpcclxuICAgICAgICBjYXNlICdHJzpcclxuICAgICAgICBjYXNlICdnJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5TaWduZWROdW1iZXI7XHJcbiAgICAgICAgY2FzZSAnWVlZWVlZJzpcclxuICAgICAgICBjYXNlICdZWVlZWSc6XHJcbiAgICAgICAgY2FzZSAnR0dHR0cnOlxyXG4gICAgICAgIGNhc2UgJ2dnZ2dnJzpcclxuICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IHBhcnNlVG9rZW5TaXhEaWdpdHMgOiBwYXJzZVRva2VuT25lVG9TaXhEaWdpdHM7XHJcbiAgICAgICAgY2FzZSAnUyc6XHJcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHsgcmV0dXJuIHBhcnNlVG9rZW5PbmVEaWdpdDsgfVxyXG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgY2FzZSAnU1MnOlxyXG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7IHJldHVybiBwYXJzZVRva2VuVHdvRGlnaXRzOyB9XHJcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICBjYXNlICdTU1MnOlxyXG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7IHJldHVybiBwYXJzZVRva2VuVGhyZWVEaWdpdHM7IH1cclxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xyXG4gICAgICAgIGNhc2UgJ0RERCc6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT25lVG9UaHJlZURpZ2l0cztcclxuICAgICAgICBjYXNlICdNTU0nOlxyXG4gICAgICAgIGNhc2UgJ01NTU0nOlxyXG4gICAgICAgIGNhc2UgJ2RkJzpcclxuICAgICAgICBjYXNlICdkZGQnOlxyXG4gICAgICAgIGNhc2UgJ2RkZGQnOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbldvcmQ7XHJcbiAgICAgICAgY2FzZSAnYSc6XHJcbiAgICAgICAgY2FzZSAnQSc6XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRMYW5nRGVmaW5pdGlvbihjb25maWcuX2wpLl9tZXJpZGllbVBhcnNlO1xyXG4gICAgICAgIGNhc2UgJ1gnOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblRpbWVzdGFtcE1zO1xyXG4gICAgICAgIGNhc2UgJ1onOlxyXG4gICAgICAgIGNhc2UgJ1paJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaW1lem9uZTtcclxuICAgICAgICBjYXNlICdUJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UO1xyXG4gICAgICAgIGNhc2UgJ1NTU1MnOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbkRpZ2l0cztcclxuICAgICAgICBjYXNlICdNTSc6XHJcbiAgICAgICAgY2FzZSAnREQnOlxyXG4gICAgICAgIGNhc2UgJ1lZJzpcclxuICAgICAgICBjYXNlICdHRyc6XHJcbiAgICAgICAgY2FzZSAnZ2cnOlxyXG4gICAgICAgIGNhc2UgJ0hIJzpcclxuICAgICAgICBjYXNlICdoaCc6XHJcbiAgICAgICAgY2FzZSAnbW0nOlxyXG4gICAgICAgIGNhc2UgJ3NzJzpcclxuICAgICAgICBjYXNlICd3dyc6XHJcbiAgICAgICAgY2FzZSAnV1cnOlxyXG4gICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gcGFyc2VUb2tlblR3b0RpZ2l0cyA6IHBhcnNlVG9rZW5PbmVPclR3b0RpZ2l0cztcclxuICAgICAgICBjYXNlICdNJzpcclxuICAgICAgICBjYXNlICdEJzpcclxuICAgICAgICBjYXNlICdkJzpcclxuICAgICAgICBjYXNlICdIJzpcclxuICAgICAgICBjYXNlICdoJzpcclxuICAgICAgICBjYXNlICdtJzpcclxuICAgICAgICBjYXNlICdzJzpcclxuICAgICAgICBjYXNlICd3JzpcclxuICAgICAgICBjYXNlICdXJzpcclxuICAgICAgICBjYXNlICdlJzpcclxuICAgICAgICBjYXNlICdFJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5PbmVPclR3b0RpZ2l0cztcclxuICAgICAgICBjYXNlICdEbyc6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT3JkaW5hbDtcclxuICAgICAgICBkZWZhdWx0IDpcclxuICAgICAgICAgICAgYSA9IG5ldyBSZWdFeHAocmVnZXhwRXNjYXBlKHVuZXNjYXBlRm9ybWF0KHRva2VuLnJlcGxhY2UoJ1xcXFwnLCAnJykpLCBcImlcIikpO1xyXG4gICAgICAgICAgICByZXR1cm4gYTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdGltZXpvbmVNaW51dGVzRnJvbVN0cmluZyhzdHJpbmcpIHtcclxuICAgICAgICBzdHJpbmcgPSBzdHJpbmcgfHwgXCJcIjtcclxuICAgICAgICB2YXIgcG9zc2libGVUek1hdGNoZXMgPSAoc3RyaW5nLm1hdGNoKHBhcnNlVG9rZW5UaW1lem9uZSkgfHwgW10pLFxyXG4gICAgICAgICAgICB0ekNodW5rID0gcG9zc2libGVUek1hdGNoZXNbcG9zc2libGVUek1hdGNoZXMubGVuZ3RoIC0gMV0gfHwgW10sXHJcbiAgICAgICAgICAgIHBhcnRzID0gKHR6Q2h1bmsgKyAnJykubWF0Y2gocGFyc2VUaW1lem9uZUNodW5rZXIpIHx8IFsnLScsIDAsIDBdLFxyXG4gICAgICAgICAgICBtaW51dGVzID0gKyhwYXJ0c1sxXSAqIDYwKSArIHRvSW50KHBhcnRzWzJdKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcnRzWzBdID09PSAnKycgPyAtbWludXRlcyA6IG1pbnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZnVuY3Rpb24gdG8gY29udmVydCBzdHJpbmcgaW5wdXQgdG8gZGF0ZVxyXG4gICAgZnVuY3Rpb24gYWRkVGltZVRvQXJyYXlGcm9tVG9rZW4odG9rZW4sIGlucHV0LCBjb25maWcpIHtcclxuICAgICAgICB2YXIgYSwgZGF0ZVBhcnRBcnJheSA9IGNvbmZpZy5fYTtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0b2tlbikge1xyXG4gICAgICAgIC8vIFFVQVJURVJcclxuICAgICAgICBjYXNlICdRJzpcclxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTU9OVEhdID0gKHRvSW50KGlucHV0KSAtIDEpICogMztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBNT05USFxyXG4gICAgICAgIGNhc2UgJ00nIDogLy8gZmFsbCB0aHJvdWdoIHRvIE1NXHJcbiAgICAgICAgY2FzZSAnTU0nIDpcclxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTU9OVEhdID0gdG9JbnQoaW5wdXQpIC0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdNTU0nIDogLy8gZmFsbCB0aHJvdWdoIHRvIE1NTU1cclxuICAgICAgICBjYXNlICdNTU1NJyA6XHJcbiAgICAgICAgICAgIGEgPSBnZXRMYW5nRGVmaW5pdGlvbihjb25maWcuX2wpLm1vbnRoc1BhcnNlKGlucHV0KTtcclxuICAgICAgICAgICAgLy8gaWYgd2UgZGlkbid0IGZpbmQgYSBtb250aCBuYW1lLCBtYXJrIHRoZSBkYXRlIGFzIGludmFsaWQuXHJcbiAgICAgICAgICAgIGlmIChhICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTU9OVEhdID0gYTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZE1vbnRoID0gaW5wdXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gREFZIE9GIE1PTlRIXHJcbiAgICAgICAgY2FzZSAnRCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gRERcclxuICAgICAgICBjYXNlICdERCcgOlxyXG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtEQVRFXSA9IHRvSW50KGlucHV0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdEbycgOlxyXG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtEQVRFXSA9IHRvSW50KHBhcnNlSW50KGlucHV0LCAxMCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIERBWSBPRiBZRUFSXHJcbiAgICAgICAgY2FzZSAnREREJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBEREREXHJcbiAgICAgICAgY2FzZSAnRERERCcgOlxyXG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0b0ludChpbnB1dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIFlFQVJcclxuICAgICAgICBjYXNlICdZWScgOlxyXG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W1lFQVJdID0gbW9tZW50LnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnWVlZWScgOlxyXG4gICAgICAgIGNhc2UgJ1lZWVlZJyA6XHJcbiAgICAgICAgY2FzZSAnWVlZWVlZJyA6XHJcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbWUVBUl0gPSB0b0ludChpbnB1dCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIEFNIC8gUE1cclxuICAgICAgICBjYXNlICdhJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBBXHJcbiAgICAgICAgY2FzZSAnQScgOlxyXG4gICAgICAgICAgICBjb25maWcuX2lzUG0gPSBnZXRMYW5nRGVmaW5pdGlvbihjb25maWcuX2wpLmlzUE0oaW5wdXQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyAyNCBIT1VSXHJcbiAgICAgICAgY2FzZSAnSCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gaGhcclxuICAgICAgICBjYXNlICdISCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gaGhcclxuICAgICAgICBjYXNlICdoJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBoaFxyXG4gICAgICAgIGNhc2UgJ2hoJyA6XHJcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIE1JTlVURVxyXG4gICAgICAgIGNhc2UgJ20nIDogLy8gZmFsbCB0aHJvdWdoIHRvIG1tXHJcbiAgICAgICAgY2FzZSAnbW0nIDpcclxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBTRUNPTkRcclxuICAgICAgICBjYXNlICdzJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBzc1xyXG4gICAgICAgIGNhc2UgJ3NzJyA6XHJcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbU0VDT05EXSA9IHRvSW50KGlucHV0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gTUlMTElTRUNPTkRcclxuICAgICAgICBjYXNlICdTJyA6XHJcbiAgICAgICAgY2FzZSAnU1MnIDpcclxuICAgICAgICBjYXNlICdTU1MnIDpcclxuICAgICAgICBjYXNlICdTU1NTJyA6XHJcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTUlMTElTRUNPTkRdID0gdG9JbnQoKCcwLicgKyBpbnB1dCkgKiAxMDAwKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gVU5JWCBUSU1FU1RBTVAgV0lUSCBNU1xyXG4gICAgICAgIGNhc2UgJ1gnOlxyXG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShwYXJzZUZsb2F0KGlucHV0KSAqIDEwMDApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBUSU1FWk9ORVxyXG4gICAgICAgIGNhc2UgJ1onIDogLy8gZmFsbCB0aHJvdWdoIHRvIFpaXHJcbiAgICAgICAgY2FzZSAnWlonIDpcclxuICAgICAgICAgICAgY29uZmlnLl91c2VVVEMgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25maWcuX3R6bSA9IHRpbWV6b25lTWludXRlc0Zyb21TdHJpbmcoaW5wdXQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBXRUVLREFZIC0gaHVtYW5cclxuICAgICAgICBjYXNlICdkZCc6XHJcbiAgICAgICAgY2FzZSAnZGRkJzpcclxuICAgICAgICBjYXNlICdkZGRkJzpcclxuICAgICAgICAgICAgYSA9IGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCkud2Vla2RheXNQYXJzZShpbnB1dCk7XHJcbiAgICAgICAgICAgIC8vIGlmIHdlIGRpZG4ndCBnZXQgYSB3ZWVrZGF5IG5hbWUsIG1hcmsgdGhlIGRhdGUgYXMgaW52YWxpZFxyXG4gICAgICAgICAgICBpZiAoYSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcuX3cgPSBjb25maWcuX3cgfHwge307XHJcbiAgICAgICAgICAgICAgICBjb25maWcuX3dbJ2QnXSA9IGE7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcuX3BmLmludmFsaWRXZWVrZGF5ID0gaW5wdXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gV0VFSywgV0VFSyBEQVkgLSBudW1lcmljXHJcbiAgICAgICAgY2FzZSAndyc6XHJcbiAgICAgICAgY2FzZSAnd3cnOlxyXG4gICAgICAgIGNhc2UgJ1cnOlxyXG4gICAgICAgIGNhc2UgJ1dXJzpcclxuICAgICAgICBjYXNlICdkJzpcclxuICAgICAgICBjYXNlICdlJzpcclxuICAgICAgICBjYXNlICdFJzpcclxuICAgICAgICAgICAgdG9rZW4gPSB0b2tlbi5zdWJzdHIoMCwgMSk7XHJcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICBjYXNlICdnZ2dnJzpcclxuICAgICAgICBjYXNlICdHR0dHJzpcclxuICAgICAgICBjYXNlICdHR0dHRyc6XHJcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW4uc3Vic3RyKDAsIDIpO1xyXG4gICAgICAgICAgICBpZiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5fdyA9IGNvbmZpZy5fdyB8fCB7fTtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5fd1t0b2tlbl0gPSB0b0ludChpbnB1dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZ2cnOlxyXG4gICAgICAgIGNhc2UgJ0dHJzpcclxuICAgICAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xyXG4gICAgICAgICAgICBjb25maWcuX3dbdG9rZW5dID0gbW9tZW50LnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtJbmZvKGNvbmZpZykge1xyXG4gICAgICAgIHZhciB3LCB3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3ksIHRlbXAsIGxhbmc7XHJcblxyXG4gICAgICAgIHcgPSBjb25maWcuX3c7XHJcbiAgICAgICAgaWYgKHcuR0cgIT0gbnVsbCB8fCB3LlcgIT0gbnVsbCB8fCB3LkUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBkb3cgPSAxO1xyXG4gICAgICAgICAgICBkb3kgPSA0O1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETzogV2UgbmVlZCB0byB0YWtlIHRoZSBjdXJyZW50IGlzb1dlZWtZZWFyLCBidXQgdGhhdCBkZXBlbmRzIG9uXHJcbiAgICAgICAgICAgIC8vIGhvdyB3ZSBpbnRlcnByZXQgbm93IChsb2NhbCwgdXRjLCBmaXhlZCBvZmZzZXQpLiBTbyBjcmVhdGVcclxuICAgICAgICAgICAgLy8gYSBub3cgdmVyc2lvbiBvZiBjdXJyZW50IGNvbmZpZyAodGFrZSBsb2NhbC91dGMvb2Zmc2V0IGZsYWdzLCBhbmRcclxuICAgICAgICAgICAgLy8gY3JlYXRlIG5vdykuXHJcbiAgICAgICAgICAgIHdlZWtZZWFyID0gZGZsKHcuR0csIGNvbmZpZy5fYVtZRUFSXSwgd2Vla09mWWVhcihtb21lbnQoKSwgMSwgNCkueWVhcik7XHJcbiAgICAgICAgICAgIHdlZWsgPSBkZmwody5XLCAxKTtcclxuICAgICAgICAgICAgd2Vla2RheSA9IGRmbCh3LkUsIDEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxhbmcgPSBnZXRMYW5nRGVmaW5pdGlvbihjb25maWcuX2wpO1xyXG4gICAgICAgICAgICBkb3cgPSBsYW5nLl93ZWVrLmRvdztcclxuICAgICAgICAgICAgZG95ID0gbGFuZy5fd2Vlay5kb3k7XHJcblxyXG4gICAgICAgICAgICB3ZWVrWWVhciA9IGRmbCh3LmdnLCBjb25maWcuX2FbWUVBUl0sIHdlZWtPZlllYXIobW9tZW50KCksIGRvdywgZG95KS55ZWFyKTtcclxuICAgICAgICAgICAgd2VlayA9IGRmbCh3LncsIDEpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHcuZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB3ZWVrZGF5IC0tIGxvdyBkYXkgbnVtYmVycyBhcmUgY29uc2lkZXJlZCBuZXh0IHdlZWtcclxuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSB3LmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAod2Vla2RheSA8IGRvdykge1xyXG4gICAgICAgICAgICAgICAgICAgICsrd2VlaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh3LmUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgLy8gbG9jYWwgd2Vla2RheSAtLSBjb3VudGluZyBzdGFydHMgZnJvbSBiZWdpbmluZyBvZiB3ZWVrXHJcbiAgICAgICAgICAgICAgICB3ZWVrZGF5ID0gdy5lICsgZG93O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gZGVmYXVsdCB0byBiZWdpbmluZyBvZiB3ZWVrXHJcbiAgICAgICAgICAgICAgICB3ZWVrZGF5ID0gZG93O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRlbXAgPSBkYXlPZlllYXJGcm9tV2Vla3Mod2Vla1llYXIsIHdlZWssIHdlZWtkYXksIGRveSwgZG93KTtcclxuXHJcbiAgICAgICAgY29uZmlnLl9hW1lFQVJdID0gdGVtcC55ZWFyO1xyXG4gICAgICAgIGNvbmZpZy5fZGF5T2ZZZWFyID0gdGVtcC5kYXlPZlllYXI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29udmVydCBhbiBhcnJheSB0byBhIGRhdGUuXHJcbiAgICAvLyB0aGUgYXJyYXkgc2hvdWxkIG1pcnJvciB0aGUgcGFyYW1ldGVycyBiZWxvd1xyXG4gICAgLy8gbm90ZTogYWxsIHZhbHVlcyBwYXN0IHRoZSB5ZWFyIGFyZSBvcHRpb25hbCBhbmQgd2lsbCBkZWZhdWx0IHRvIHRoZSBsb3dlc3QgcG9zc2libGUgdmFsdWUuXHJcbiAgICAvLyBbeWVhciwgbW9udGgsIGRheSAsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtaWxsaXNlY29uZF1cclxuICAgIGZ1bmN0aW9uIGRhdGVGcm9tQ29uZmlnKGNvbmZpZykge1xyXG4gICAgICAgIHZhciBpLCBkYXRlLCBpbnB1dCA9IFtdLCBjdXJyZW50RGF0ZSwgeWVhclRvVXNlO1xyXG5cclxuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN1cnJlbnREYXRlID0gY3VycmVudERhdGVBcnJheShjb25maWcpO1xyXG5cclxuICAgICAgICAvL2NvbXB1dGUgZGF5IG9mIHRoZSB5ZWFyIGZyb20gd2Vla3MgYW5kIHdlZWtkYXlzXHJcbiAgICAgICAgaWYgKGNvbmZpZy5fdyAmJiBjb25maWcuX2FbREFURV0gPT0gbnVsbCAmJiBjb25maWcuX2FbTU9OVEhdID09IG51bGwpIHtcclxuICAgICAgICAgICAgZGF5T2ZZZWFyRnJvbVdlZWtJbmZvKGNvbmZpZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL2lmIHRoZSBkYXkgb2YgdGhlIHllYXIgaXMgc2V0LCBmaWd1cmUgb3V0IHdoYXQgaXQgaXNcclxuICAgICAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIpIHtcclxuICAgICAgICAgICAgeWVhclRvVXNlID0gZGZsKGNvbmZpZy5fYVtZRUFSXSwgY3VycmVudERhdGVbWUVBUl0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5fZGF5T2ZZZWFyID4gZGF5c0luWWVhcih5ZWFyVG9Vc2UpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcuX3BmLl9vdmVyZmxvd0RheU9mWWVhciA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRhdGUgPSBtYWtlVVRDRGF0ZSh5ZWFyVG9Vc2UsIDAsIGNvbmZpZy5fZGF5T2ZZZWFyKTtcclxuICAgICAgICAgICAgY29uZmlnLl9hW01PTlRIXSA9IGRhdGUuZ2V0VVRDTW9udGgoKTtcclxuICAgICAgICAgICAgY29uZmlnLl9hW0RBVEVdID0gZGF0ZS5nZXRVVENEYXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgZGF0ZS5cclxuICAgICAgICAvLyAqIGlmIG5vIHllYXIsIG1vbnRoLCBkYXkgb2YgbW9udGggYXJlIGdpdmVuLCBkZWZhdWx0IHRvIHRvZGF5XHJcbiAgICAgICAgLy8gKiBpZiBkYXkgb2YgbW9udGggaXMgZ2l2ZW4sIGRlZmF1bHQgbW9udGggYW5kIHllYXJcclxuICAgICAgICAvLyAqIGlmIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG9ubHkgeWVhclxyXG4gICAgICAgIC8vICogaWYgeWVhciBpcyBnaXZlbiwgZG9uJ3QgZGVmYXVsdCBhbnl0aGluZ1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAzICYmIGNvbmZpZy5fYVtpXSA9PSBudWxsOyArK2kpIHtcclxuICAgICAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSBjdXJyZW50RGF0ZVtpXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFplcm8gb3V0IHdoYXRldmVyIHdhcyBub3QgZGVmYXVsdGVkLCBpbmNsdWRpbmcgdGltZVxyXG4gICAgICAgIGZvciAoOyBpIDwgNzsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gKGNvbmZpZy5fYVtpXSA9PSBudWxsKSA/IChpID09PSAyID8gMSA6IDApIDogY29uZmlnLl9hW2ldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uZmlnLl9kID0gKGNvbmZpZy5fdXNlVVRDID8gbWFrZVVUQ0RhdGUgOiBtYWtlRGF0ZSkuYXBwbHkobnVsbCwgaW5wdXQpO1xyXG4gICAgICAgIC8vIEFwcGx5IHRpbWV6b25lIG9mZnNldCBmcm9tIGlucHV0LiBUaGUgYWN0dWFsIHpvbmUgY2FuIGJlIGNoYW5nZWRcclxuICAgICAgICAvLyB3aXRoIHBhcnNlWm9uZS5cclxuICAgICAgICBpZiAoY29uZmlnLl90em0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjb25maWcuX2Quc2V0VVRDTWludXRlcyhjb25maWcuX2QuZ2V0VVRDTWludXRlcygpICsgY29uZmlnLl90em0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkYXRlRnJvbU9iamVjdChjb25maWcpIHtcclxuICAgICAgICB2YXIgbm9ybWFsaXplZElucHV0O1xyXG5cclxuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5vcm1hbGl6ZWRJbnB1dCA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKGNvbmZpZy5faSk7XHJcbiAgICAgICAgY29uZmlnLl9hID0gW1xyXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQueWVhcixcclxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0Lm1vbnRoLFxyXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuZGF5LFxyXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuaG91cixcclxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0Lm1pbnV0ZSxcclxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0LnNlY29uZCxcclxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0Lm1pbGxpc2Vjb25kXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjdXJyZW50RGF0ZUFycmF5KGNvbmZpZykge1xyXG4gICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGlmIChjb25maWcuX3VzZVVUQykge1xyXG4gICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgbm93LmdldFVUQ0Z1bGxZZWFyKCksXHJcbiAgICAgICAgICAgICAgICBub3cuZ2V0VVRDTW9udGgoKSxcclxuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENEYXRlKClcclxuICAgICAgICAgICAgXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gW25vdy5nZXRGdWxsWWVhcigpLCBub3cuZ2V0TW9udGgoKSwgbm93LmdldERhdGUoKV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGRhdGUgZnJvbSBzdHJpbmcgYW5kIGZvcm1hdCBzdHJpbmdcclxuICAgIGZ1bmN0aW9uIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpIHtcclxuXHJcbiAgICAgICAgaWYgKGNvbmZpZy5fZiA9PT0gbW9tZW50LklTT184NjAxKSB7XHJcbiAgICAgICAgICAgIHBhcnNlSVNPKGNvbmZpZyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbmZpZy5fYSA9IFtdO1xyXG4gICAgICAgIGNvbmZpZy5fcGYuZW1wdHkgPSB0cnVlO1xyXG5cclxuICAgICAgICAvLyBUaGlzIGFycmF5IGlzIHVzZWQgdG8gbWFrZSBhIERhdGUsIGVpdGhlciB3aXRoIGBuZXcgRGF0ZWAgb3IgYERhdGUuVVRDYFxyXG4gICAgICAgIHZhciBsYW5nID0gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKSxcclxuICAgICAgICAgICAgc3RyaW5nID0gJycgKyBjb25maWcuX2ksXHJcbiAgICAgICAgICAgIGksIHBhcnNlZElucHV0LCB0b2tlbnMsIHRva2VuLCBza2lwcGVkLFxyXG4gICAgICAgICAgICBzdHJpbmdMZW5ndGggPSBzdHJpbmcubGVuZ3RoLFxyXG4gICAgICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgdG9rZW5zID0gZXhwYW5kRm9ybWF0KGNvbmZpZy5fZiwgbGFuZykubWF0Y2goZm9ybWF0dGluZ1Rva2VucykgfHwgW107XHJcblxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XHJcbiAgICAgICAgICAgIHBhcnNlZElucHV0ID0gKHN0cmluZy5tYXRjaChnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4odG9rZW4sIGNvbmZpZykpIHx8IFtdKVswXTtcclxuICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XHJcbiAgICAgICAgICAgICAgICBza2lwcGVkID0gc3RyaW5nLnN1YnN0cigwLCBzdHJpbmcuaW5kZXhPZihwYXJzZWRJbnB1dCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNraXBwZWQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYudW51c2VkSW5wdXQucHVzaChza2lwcGVkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5zbGljZShzdHJpbmcuaW5kZXhPZihwYXJzZWRJbnB1dCkgKyBwYXJzZWRJbnB1dC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCArPSBwYXJzZWRJbnB1dC5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gZG9uJ3QgcGFyc2UgaWYgaXQncyBub3QgYSBrbm93biB0b2tlblxyXG4gICAgICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbdG9rZW5dKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyc2VkSW5wdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25maWcuX3BmLmVtcHR5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBwYXJzZWRJbnB1dCwgY29uZmlnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChjb25maWcuX3N0cmljdCAmJiAhcGFyc2VkSW5wdXQpIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYudW51c2VkVG9rZW5zLnB1c2godG9rZW4pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBhZGQgcmVtYWluaW5nIHVucGFyc2VkIGlucHV0IGxlbmd0aCB0byB0aGUgc3RyaW5nXHJcbiAgICAgICAgY29uZmlnLl9wZi5jaGFyc0xlZnRPdmVyID0gc3RyaW5nTGVuZ3RoIC0gdG90YWxQYXJzZWRJbnB1dExlbmd0aDtcclxuICAgICAgICBpZiAoc3RyaW5nLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29uZmlnLl9wZi51bnVzZWRJbnB1dC5wdXNoKHN0cmluZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBoYW5kbGUgYW0gcG1cclxuICAgICAgICBpZiAoY29uZmlnLl9pc1BtICYmIGNvbmZpZy5fYVtIT1VSXSA8IDEyKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fYVtIT1VSXSArPSAxMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gaWYgaXMgMTIgYW0sIGNoYW5nZSBob3VycyB0byAwXHJcbiAgICAgICAgaWYgKGNvbmZpZy5faXNQbSA9PT0gZmFsc2UgJiYgY29uZmlnLl9hW0hPVVJdID09PSAxMikge1xyXG4gICAgICAgICAgICBjb25maWcuX2FbSE9VUl0gPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcclxuICAgICAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdW5lc2NhcGVGb3JtYXQocykge1xyXG4gICAgICAgIHJldHVybiBzLnJlcGxhY2UoL1xcXFwoXFxbKXxcXFxcKFxcXSl8XFxbKFteXFxdXFxbXSopXFxdfFxcXFwoLikvZywgZnVuY3Rpb24gKG1hdGNoZWQsIHAxLCBwMiwgcDMsIHA0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwMSB8fCBwMiB8fCBwMyB8fCBwNDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNTYxNDkzL2lzLXRoZXJlLWEtcmVnZXhwLWVzY2FwZS1mdW5jdGlvbi1pbi1qYXZhc2NyaXB0XHJcbiAgICBmdW5jdGlvbiByZWdleHBFc2NhcGUocykge1xyXG4gICAgICAgIHJldHVybiBzLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRhdGUgZnJvbSBzdHJpbmcgYW5kIGFycmF5IG9mIGZvcm1hdCBzdHJpbmdzXHJcbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21TdHJpbmdBbmRBcnJheShjb25maWcpIHtcclxuICAgICAgICB2YXIgdGVtcENvbmZpZyxcclxuICAgICAgICAgICAgYmVzdE1vbWVudCxcclxuXHJcbiAgICAgICAgICAgIHNjb3JlVG9CZWF0LFxyXG4gICAgICAgICAgICBpLFxyXG4gICAgICAgICAgICBjdXJyZW50U2NvcmU7XHJcblxyXG4gICAgICAgIGlmIChjb25maWcuX2YubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZEZvcm1hdCA9IHRydWU7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKE5hTik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb25maWcuX2YubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY3VycmVudFNjb3JlID0gMDtcclxuICAgICAgICAgICAgdGVtcENvbmZpZyA9IGV4dGVuZCh7fSwgY29uZmlnKTtcclxuICAgICAgICAgICAgdGVtcENvbmZpZy5fcGYgPSBkZWZhdWx0UGFyc2luZ0ZsYWdzKCk7XHJcbiAgICAgICAgICAgIHRlbXBDb25maWcuX2YgPSBjb25maWcuX2ZbaV07XHJcbiAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEZvcm1hdCh0ZW1wQ29uZmlnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNWYWxpZCh0ZW1wQ29uZmlnKSkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIGFueSBpbnB1dCB0aGF0IHdhcyBub3QgcGFyc2VkIGFkZCBhIHBlbmFsdHkgZm9yIHRoYXQgZm9ybWF0XHJcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZSArPSB0ZW1wQ29uZmlnLl9wZi5jaGFyc0xlZnRPdmVyO1xyXG5cclxuICAgICAgICAgICAgLy9vciB0b2tlbnNcclxuICAgICAgICAgICAgY3VycmVudFNjb3JlICs9IHRlbXBDb25maWcuX3BmLnVudXNlZFRva2Vucy5sZW5ndGggKiAxMDtcclxuXHJcbiAgICAgICAgICAgIHRlbXBDb25maWcuX3BmLnNjb3JlID0gY3VycmVudFNjb3JlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNjb3JlVG9CZWF0ID09IG51bGwgfHwgY3VycmVudFNjb3JlIDwgc2NvcmVUb0JlYXQpIHtcclxuICAgICAgICAgICAgICAgIHNjb3JlVG9CZWF0ID0gY3VycmVudFNjb3JlO1xyXG4gICAgICAgICAgICAgICAgYmVzdE1vbWVudCA9IHRlbXBDb25maWc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dGVuZChjb25maWcsIGJlc3RNb21lbnQgfHwgdGVtcENvbmZpZyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGF0ZSBmcm9tIGlzbyBmb3JtYXRcclxuICAgIGZ1bmN0aW9uIHBhcnNlSVNPKGNvbmZpZykge1xyXG4gICAgICAgIHZhciBpLCBsLFxyXG4gICAgICAgICAgICBzdHJpbmcgPSBjb25maWcuX2ksXHJcbiAgICAgICAgICAgIG1hdGNoID0gaXNvUmVnZXguZXhlYyhzdHJpbmcpO1xyXG5cclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uZmlnLl9wZi5pc28gPSB0cnVlO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvRGF0ZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNvRGF0ZXNbaV1bMV0uZXhlYyhzdHJpbmcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbWF0Y2hbNV0gc2hvdWxkIGJlIFwiVFwiIG9yIHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fZiA9IGlzb0RhdGVzW2ldWzBdICsgKG1hdGNoWzZdIHx8IFwiIFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvVGltZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNvVGltZXNbaV1bMV0uZXhlYyhzdHJpbmcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLl9mICs9IGlzb1RpbWVzW2ldWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdHJpbmcubWF0Y2gocGFyc2VUb2tlblRpbWV6b25lKSkge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLl9mICs9IFwiWlwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBkYXRlIGZyb20gaXNvIGZvcm1hdCBvciBmYWxsYmFja1xyXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tU3RyaW5nKGNvbmZpZykge1xyXG4gICAgICAgIHBhcnNlSVNPKGNvbmZpZyk7XHJcbiAgICAgICAgaWYgKGNvbmZpZy5faXNWYWxpZCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgZGVsZXRlIGNvbmZpZy5faXNWYWxpZDtcclxuICAgICAgICAgICAgbW9tZW50LmNyZWF0ZUZyb21JbnB1dEZhbGxiYWNrKGNvbmZpZyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VEYXRlRnJvbUlucHV0KGNvbmZpZykge1xyXG4gICAgICAgIHZhciBpbnB1dCA9IGNvbmZpZy5faSxcclxuICAgICAgICAgICAgbWF0Y2hlZCA9IGFzcE5ldEpzb25SZWdleC5leGVjKGlucHV0KTtcclxuXHJcbiAgICAgICAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG1hdGNoZWQpIHtcclxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoK21hdGNoZWRbMV0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21TdHJpbmcoY29uZmlnKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkoaW5wdXQpKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fYSA9IGlucHV0LnNsaWNlKDApO1xyXG4gICAgICAgICAgICBkYXRlRnJvbUNvbmZpZyhjb25maWcpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoaXNEYXRlKGlucHV0KSkge1xyXG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgraW5wdXQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKGlucHV0KSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgZGF0ZUZyb21PYmplY3QoY29uZmlnKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZihpbnB1dCkgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIC8vIGZyb20gbWlsbGlzZWNvbmRzXHJcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBtb21lbnQuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2soY29uZmlnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZURhdGUoeSwgbSwgZCwgaCwgTSwgcywgbXMpIHtcclxuICAgICAgICAvL2Nhbid0IGp1c3QgYXBwbHkoKSB0byBjcmVhdGUgYSBkYXRlOlxyXG4gICAgICAgIC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xODEzNDgvaW5zdGFudGlhdGluZy1hLWphdmFzY3JpcHQtb2JqZWN0LWJ5LWNhbGxpbmctcHJvdG90eXBlLWNvbnN0cnVjdG9yLWFwcGx5XHJcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSh5LCBtLCBkLCBoLCBNLCBzLCBtcyk7XHJcblxyXG4gICAgICAgIC8vdGhlIGRhdGUgY29uc3RydWN0b3IgZG9lc24ndCBhY2NlcHQgeWVhcnMgPCAxOTcwXHJcbiAgICAgICAgaWYgKHkgPCAxOTcwKSB7XHJcbiAgICAgICAgICAgIGRhdGUuc2V0RnVsbFllYXIoeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VVVENEYXRlKHkpIHtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKERhdGUuVVRDLmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xyXG4gICAgICAgIGlmICh5IDwgMTk3MCkge1xyXG4gICAgICAgICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZVdlZWtkYXkoaW5wdXQsIGxhbmd1YWdlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgaWYgKCFpc05hTihpbnB1dCkpIHtcclxuICAgICAgICAgICAgICAgIGlucHV0ID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlucHV0ID0gbGFuZ3VhZ2Uud2Vla2RheXNQYXJzZShpbnB1dCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpbnB1dDtcclxuICAgIH1cclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgUmVsYXRpdmUgVGltZVxyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgICAvLyBoZWxwZXIgZnVuY3Rpb24gZm9yIG1vbWVudC5mbi5mcm9tLCBtb21lbnQuZm4uZnJvbU5vdywgYW5kIG1vbWVudC5kdXJhdGlvbi5mbi5odW1hbml6ZVxyXG4gICAgZnVuY3Rpb24gc3Vic3RpdHV0ZVRpbWVBZ28oc3RyaW5nLCBudW1iZXIsIHdpdGhvdXRTdWZmaXgsIGlzRnV0dXJlLCBsYW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIGxhbmcucmVsYXRpdmVUaW1lKG51bWJlciB8fCAxLCAhIXdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlbGF0aXZlVGltZShtaWxsaXNlY29uZHMsIHdpdGhvdXRTdWZmaXgsIGxhbmcpIHtcclxuICAgICAgICB2YXIgc2Vjb25kcyA9IHJvdW5kKE1hdGguYWJzKG1pbGxpc2Vjb25kcykgLyAxMDAwKSxcclxuICAgICAgICAgICAgbWludXRlcyA9IHJvdW5kKHNlY29uZHMgLyA2MCksXHJcbiAgICAgICAgICAgIGhvdXJzID0gcm91bmQobWludXRlcyAvIDYwKSxcclxuICAgICAgICAgICAgZGF5cyA9IHJvdW5kKGhvdXJzIC8gMjQpLFxyXG4gICAgICAgICAgICB5ZWFycyA9IHJvdW5kKGRheXMgLyAzNjUpLFxyXG4gICAgICAgICAgICBhcmdzID0gc2Vjb25kcyA8IHJlbGF0aXZlVGltZVRocmVzaG9sZHMucyAgJiYgWydzJywgc2Vjb25kc10gfHxcclxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPT09IDEgJiYgWydtJ10gfHxcclxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPCByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzLm0gJiYgWydtbScsIG1pbnV0ZXNdIHx8XHJcbiAgICAgICAgICAgICAgICBob3VycyA9PT0gMSAmJiBbJ2gnXSB8fFxyXG4gICAgICAgICAgICAgICAgaG91cnMgPCByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzLmggJiYgWydoaCcsIGhvdXJzXSB8fFxyXG4gICAgICAgICAgICAgICAgZGF5cyA9PT0gMSAmJiBbJ2QnXSB8fFxyXG4gICAgICAgICAgICAgICAgZGF5cyA8PSByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzLmRkICYmIFsnZGQnLCBkYXlzXSB8fFxyXG4gICAgICAgICAgICAgICAgZGF5cyA8PSByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzLmRtICYmIFsnTSddIHx8XHJcbiAgICAgICAgICAgICAgICBkYXlzIDwgcmVsYXRpdmVUaW1lVGhyZXNob2xkcy5keSAmJiBbJ01NJywgcm91bmQoZGF5cyAvIDMwKV0gfHxcclxuICAgICAgICAgICAgICAgIHllYXJzID09PSAxICYmIFsneSddIHx8IFsneXknLCB5ZWFyc107XHJcbiAgICAgICAgYXJnc1syXSA9IHdpdGhvdXRTdWZmaXg7XHJcbiAgICAgICAgYXJnc1szXSA9IG1pbGxpc2Vjb25kcyA+IDA7XHJcbiAgICAgICAgYXJnc1s0XSA9IGxhbmc7XHJcbiAgICAgICAgcmV0dXJuIHN1YnN0aXR1dGVUaW1lQWdvLmFwcGx5KHt9LCBhcmdzKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIFdlZWsgb2YgWWVhclxyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgICAvLyBmaXJzdERheU9mV2VlayAgICAgICAwID0gc3VuLCA2ID0gc2F0XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICB0aGUgZGF5IG9mIHRoZSB3ZWVrIHRoYXQgc3RhcnRzIHRoZSB3ZWVrXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAodXN1YWxseSBzdW5kYXkgb3IgbW9uZGF5KVxyXG4gICAgLy8gZmlyc3REYXlPZldlZWtPZlllYXIgMCA9IHN1biwgNiA9IHNhdFxyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgdGhlIGZpcnN0IHdlZWsgaXMgdGhlIHdlZWsgdGhhdCBjb250YWlucyB0aGUgZmlyc3RcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIG9mIHRoaXMgZGF5IG9mIHRoZSB3ZWVrXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAoZWcuIElTTyB3ZWVrcyB1c2UgdGh1cnNkYXkgKDQpKVxyXG4gICAgZnVuY3Rpb24gd2Vla09mWWVhcihtb20sIGZpcnN0RGF5T2ZXZWVrLCBmaXJzdERheU9mV2Vla09mWWVhcikge1xyXG4gICAgICAgIHZhciBlbmQgPSBmaXJzdERheU9mV2Vla09mWWVhciAtIGZpcnN0RGF5T2ZXZWVrLFxyXG4gICAgICAgICAgICBkYXlzVG9EYXlPZldlZWsgPSBmaXJzdERheU9mV2Vla09mWWVhciAtIG1vbS5kYXkoKSxcclxuICAgICAgICAgICAgYWRqdXN0ZWRNb21lbnQ7XHJcblxyXG5cclxuICAgICAgICBpZiAoZGF5c1RvRGF5T2ZXZWVrID4gZW5kKSB7XHJcbiAgICAgICAgICAgIGRheXNUb0RheU9mV2VlayAtPSA3O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRheXNUb0RheU9mV2VlayA8IGVuZCAtIDcpIHtcclxuICAgICAgICAgICAgZGF5c1RvRGF5T2ZXZWVrICs9IDc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhZGp1c3RlZE1vbWVudCA9IG1vbWVudChtb20pLmFkZCgnZCcsIGRheXNUb0RheU9mV2Vlayk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgd2VlazogTWF0aC5jZWlsKGFkanVzdGVkTW9tZW50LmRheU9mWWVhcigpIC8gNyksXHJcbiAgICAgICAgICAgIHllYXI6IGFkanVzdGVkTW9tZW50LnllYXIoKVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy9odHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT193ZWVrX2RhdGUjQ2FsY3VsYXRpbmdfYV9kYXRlX2dpdmVuX3RoZV95ZWFyLjJDX3dlZWtfbnVtYmVyX2FuZF93ZWVrZGF5XHJcbiAgICBmdW5jdGlvbiBkYXlPZlllYXJGcm9tV2Vla3MoeWVhciwgd2Vlaywgd2Vla2RheSwgZmlyc3REYXlPZldlZWtPZlllYXIsIGZpcnN0RGF5T2ZXZWVrKSB7XHJcbiAgICAgICAgdmFyIGQgPSBtYWtlVVRDRGF0ZSh5ZWFyLCAwLCAxKS5nZXRVVENEYXkoKSwgZGF5c1RvQWRkLCBkYXlPZlllYXI7XHJcblxyXG4gICAgICAgIGQgPSBkID09PSAwID8gNyA6IGQ7XHJcbiAgICAgICAgd2Vla2RheSA9IHdlZWtkYXkgIT0gbnVsbCA/IHdlZWtkYXkgOiBmaXJzdERheU9mV2VlaztcclxuICAgICAgICBkYXlzVG9BZGQgPSBmaXJzdERheU9mV2VlayAtIGQgKyAoZCA+IGZpcnN0RGF5T2ZXZWVrT2ZZZWFyID8gNyA6IDApIC0gKGQgPCBmaXJzdERheU9mV2VlayA/IDcgOiAwKTtcclxuICAgICAgICBkYXlPZlllYXIgPSA3ICogKHdlZWsgLSAxKSArICh3ZWVrZGF5IC0gZmlyc3REYXlPZldlZWspICsgZGF5c1RvQWRkICsgMTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgeWVhcjogZGF5T2ZZZWFyID4gMCA/IHllYXIgOiB5ZWFyIC0gMSxcclxuICAgICAgICAgICAgZGF5T2ZZZWFyOiBkYXlPZlllYXIgPiAwID8gIGRheU9mWWVhciA6IGRheXNJblllYXIoeWVhciAtIDEpICsgZGF5T2ZZZWFyXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgVG9wIExldmVsIEZ1bmN0aW9uc1xyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VNb21lbnQoY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLFxyXG4gICAgICAgICAgICBmb3JtYXQgPSBjb25maWcuX2Y7XHJcblxyXG4gICAgICAgIGlmIChpbnB1dCA9PT0gbnVsbCB8fCAoZm9ybWF0ID09PSB1bmRlZmluZWQgJiYgaW5wdXQgPT09ICcnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmludmFsaWQoe251bGxJbnB1dDogdHJ1ZX0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgY29uZmlnLl9pID0gaW5wdXQgPSBnZXRMYW5nRGVmaW5pdGlvbigpLnByZXBhcnNlKGlucHV0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtb21lbnQuaXNNb21lbnQoaW5wdXQpKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZyA9IGNsb25lTW9tZW50KGlucHV0KTtcclxuXHJcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKCtpbnB1dC5fZCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQpIHtcclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkoZm9ybWF0KSkge1xyXG4gICAgICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kQXJyYXkoY29uZmlnKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbWFrZURhdGVGcm9tSW5wdXQoY29uZmlnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgTW9tZW50KGNvbmZpZyk7XHJcbiAgICB9XHJcblxyXG4gICAgbW9tZW50ID0gZnVuY3Rpb24gKGlucHV0LCBmb3JtYXQsIGxhbmcsIHN0cmljdCkge1xyXG4gICAgICAgIHZhciBjO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mKGxhbmcpID09PSBcImJvb2xlYW5cIikge1xyXG4gICAgICAgICAgICBzdHJpY3QgPSBsYW5nO1xyXG4gICAgICAgICAgICBsYW5nID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cclxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTQyM1xyXG4gICAgICAgIGMgPSB7fTtcclxuICAgICAgICBjLl9pc0FNb21lbnRPYmplY3QgPSB0cnVlO1xyXG4gICAgICAgIGMuX2kgPSBpbnB1dDtcclxuICAgICAgICBjLl9mID0gZm9ybWF0O1xyXG4gICAgICAgIGMuX2wgPSBsYW5nO1xyXG4gICAgICAgIGMuX3N0cmljdCA9IHN0cmljdDtcclxuICAgICAgICBjLl9pc1VUQyA9IGZhbHNlO1xyXG4gICAgICAgIGMuX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xyXG5cclxuICAgICAgICByZXR1cm4gbWFrZU1vbWVudChjKTtcclxuICAgIH07XHJcblxyXG4gICAgbW9tZW50LnN1cHByZXNzRGVwcmVjYXRpb25XYXJuaW5ncyA9IGZhbHNlO1xyXG5cclxuICAgIG1vbWVudC5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayA9IGRlcHJlY2F0ZShcclxuICAgICAgICAgICAgXCJtb21lbnQgY29uc3RydWN0aW9uIGZhbGxzIGJhY2sgdG8ganMgRGF0ZS4gVGhpcyBpcyBcIiArXHJcbiAgICAgICAgICAgIFwiZGlzY291cmFnZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiB1cGNvbWluZyBtYWpvciBcIiArXHJcbiAgICAgICAgICAgIFwicmVsZWFzZS4gUGxlYXNlIHJlZmVyIHRvIFwiICtcclxuICAgICAgICAgICAgXCJodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTQwNyBmb3IgbW9yZSBpbmZvLlwiLFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoY29uZmlnKSB7XHJcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoY29uZmlnLl9pKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFBpY2sgYSBtb21lbnQgbSBmcm9tIG1vbWVudHMgc28gdGhhdCBtW2ZuXShvdGhlcikgaXMgdHJ1ZSBmb3IgYWxsXHJcbiAgICAvLyBvdGhlci4gVGhpcyByZWxpZXMgb24gdGhlIGZ1bmN0aW9uIGZuIHRvIGJlIHRyYW5zaXRpdmUuXHJcbiAgICAvL1xyXG4gICAgLy8gbW9tZW50cyBzaG91bGQgZWl0aGVyIGJlIGFuIGFycmF5IG9mIG1vbWVudCBvYmplY3RzIG9yIGFuIGFycmF5LCB3aG9zZVxyXG4gICAgLy8gZmlyc3QgZWxlbWVudCBpcyBhbiBhcnJheSBvZiBtb21lbnQgb2JqZWN0cy5cclxuICAgIGZ1bmN0aW9uIHBpY2tCeShmbiwgbW9tZW50cykge1xyXG4gICAgICAgIHZhciByZXMsIGk7XHJcbiAgICAgICAgaWYgKG1vbWVudHMubGVuZ3RoID09PSAxICYmIGlzQXJyYXkobW9tZW50c1swXSkpIHtcclxuICAgICAgICAgICAgbW9tZW50cyA9IG1vbWVudHNbMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghbW9tZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXMgPSBtb21lbnRzWzBdO1xyXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBtb21lbnRzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIGlmIChtb21lbnRzW2ldW2ZuXShyZXMpKSB7XHJcbiAgICAgICAgICAgICAgICByZXMgPSBtb21lbnRzW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9XHJcblxyXG4gICAgbW9tZW50Lm1pbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHBpY2tCeSgnaXNCZWZvcmUnLCBhcmdzKTtcclxuICAgIH07XHJcblxyXG4gICAgbW9tZW50Lm1heCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHBpY2tCeSgnaXNBZnRlcicsIGFyZ3MpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBjcmVhdGluZyB3aXRoIHV0Y1xyXG4gICAgbW9tZW50LnV0YyA9IGZ1bmN0aW9uIChpbnB1dCwgZm9ybWF0LCBsYW5nLCBzdHJpY3QpIHtcclxuICAgICAgICB2YXIgYztcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZihsYW5nKSA9PT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgICAgICAgc3RyaWN0ID0gbGFuZztcclxuICAgICAgICAgICAgbGFuZyA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gb2JqZWN0IGNvbnN0cnVjdGlvbiBtdXN0IGJlIGRvbmUgdGhpcyB3YXkuXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcclxuICAgICAgICBjID0ge307XHJcbiAgICAgICAgYy5faXNBTW9tZW50T2JqZWN0ID0gdHJ1ZTtcclxuICAgICAgICBjLl91c2VVVEMgPSB0cnVlO1xyXG4gICAgICAgIGMuX2lzVVRDID0gdHJ1ZTtcclxuICAgICAgICBjLl9sID0gbGFuZztcclxuICAgICAgICBjLl9pID0gaW5wdXQ7XHJcbiAgICAgICAgYy5fZiA9IGZvcm1hdDtcclxuICAgICAgICBjLl9zdHJpY3QgPSBzdHJpY3Q7XHJcbiAgICAgICAgYy5fcGYgPSBkZWZhdWx0UGFyc2luZ0ZsYWdzKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBtYWtlTW9tZW50KGMpLnV0YygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBjcmVhdGluZyB3aXRoIHVuaXggdGltZXN0YW1wIChpbiBzZWNvbmRzKVxyXG4gICAgbW9tZW50LnVuaXggPSBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICByZXR1cm4gbW9tZW50KGlucHV0ICogMTAwMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGR1cmF0aW9uXHJcbiAgICBtb21lbnQuZHVyYXRpb24gPSBmdW5jdGlvbiAoaW5wdXQsIGtleSkge1xyXG4gICAgICAgIHZhciBkdXJhdGlvbiA9IGlucHV0LFxyXG4gICAgICAgICAgICAvLyBtYXRjaGluZyBhZ2FpbnN0IHJlZ2V4cCBpcyBleHBlbnNpdmUsIGRvIGl0IG9uIGRlbWFuZFxyXG4gICAgICAgICAgICBtYXRjaCA9IG51bGwsXHJcbiAgICAgICAgICAgIHNpZ24sXHJcbiAgICAgICAgICAgIHJldCxcclxuICAgICAgICAgICAgcGFyc2VJc287XHJcblxyXG4gICAgICAgIGlmIChtb21lbnQuaXNEdXJhdGlvbihpbnB1dCkpIHtcclxuICAgICAgICAgICAgZHVyYXRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICBtczogaW5wdXQuX21pbGxpc2Vjb25kcyxcclxuICAgICAgICAgICAgICAgIGQ6IGlucHV0Ll9kYXlzLFxyXG4gICAgICAgICAgICAgICAgTTogaW5wdXQuX21vbnRoc1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICBkdXJhdGlvbiA9IHt9O1xyXG4gICAgICAgICAgICBpZiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICBkdXJhdGlvbltrZXldID0gaW5wdXQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkdXJhdGlvbi5taWxsaXNlY29uZHMgPSBpbnB1dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoISEobWF0Y2ggPSBhc3BOZXRUaW1lU3Bhbkpzb25SZWdleC5leGVjKGlucHV0KSkpIHtcclxuICAgICAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gXCItXCIpID8gLTEgOiAxO1xyXG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgIHk6IDAsXHJcbiAgICAgICAgICAgICAgICBkOiB0b0ludChtYXRjaFtEQVRFXSkgKiBzaWduLFxyXG4gICAgICAgICAgICAgICAgaDogdG9JbnQobWF0Y2hbSE9VUl0pICogc2lnbixcclxuICAgICAgICAgICAgICAgIG06IHRvSW50KG1hdGNoW01JTlVURV0pICogc2lnbixcclxuICAgICAgICAgICAgICAgIHM6IHRvSW50KG1hdGNoW1NFQ09ORF0pICogc2lnbixcclxuICAgICAgICAgICAgICAgIG1zOiB0b0ludChtYXRjaFtNSUxMSVNFQ09ORF0pICogc2lnblxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSBpZiAoISEobWF0Y2ggPSBpc29EdXJhdGlvblJlZ2V4LmV4ZWMoaW5wdXQpKSkge1xyXG4gICAgICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSBcIi1cIikgPyAtMSA6IDE7XHJcbiAgICAgICAgICAgIHBhcnNlSXNvID0gZnVuY3Rpb24gKGlucCkge1xyXG4gICAgICAgICAgICAgICAgLy8gV2UnZCBub3JtYWxseSB1c2Ugfn5pbnAgZm9yIHRoaXMsIGJ1dCB1bmZvcnR1bmF0ZWx5IGl0IGFsc29cclxuICAgICAgICAgICAgICAgIC8vIGNvbnZlcnRzIGZsb2F0cyB0byBpbnRzLlxyXG4gICAgICAgICAgICAgICAgLy8gaW5wIG1heSBiZSB1bmRlZmluZWQsIHNvIGNhcmVmdWwgY2FsbGluZyByZXBsYWNlIG9uIGl0LlxyXG4gICAgICAgICAgICAgICAgdmFyIHJlcyA9IGlucCAmJiBwYXJzZUZsb2F0KGlucC5yZXBsYWNlKCcsJywgJy4nKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBhcHBseSBzaWduIHdoaWxlIHdlJ3JlIGF0IGl0XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGlzTmFOKHJlcykgPyAwIDogcmVzKSAqIHNpZ247XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge1xyXG4gICAgICAgICAgICAgICAgeTogcGFyc2VJc28obWF0Y2hbMl0pLFxyXG4gICAgICAgICAgICAgICAgTTogcGFyc2VJc28obWF0Y2hbM10pLFxyXG4gICAgICAgICAgICAgICAgZDogcGFyc2VJc28obWF0Y2hbNF0pLFxyXG4gICAgICAgICAgICAgICAgaDogcGFyc2VJc28obWF0Y2hbNV0pLFxyXG4gICAgICAgICAgICAgICAgbTogcGFyc2VJc28obWF0Y2hbNl0pLFxyXG4gICAgICAgICAgICAgICAgczogcGFyc2VJc28obWF0Y2hbN10pLFxyXG4gICAgICAgICAgICAgICAgdzogcGFyc2VJc28obWF0Y2hbOF0pXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXQgPSBuZXcgRHVyYXRpb24oZHVyYXRpb24pO1xyXG5cclxuICAgICAgICBpZiAobW9tZW50LmlzRHVyYXRpb24oaW5wdXQpICYmIGlucHV0Lmhhc093blByb3BlcnR5KCdfbGFuZycpKSB7XHJcbiAgICAgICAgICAgIHJldC5fbGFuZyA9IGlucHV0Ll9sYW5nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH07XHJcblxyXG4gICAgLy8gdmVyc2lvbiBudW1iZXJcclxuICAgIG1vbWVudC52ZXJzaW9uID0gVkVSU0lPTjtcclxuXHJcbiAgICAvLyBkZWZhdWx0IGZvcm1hdFxyXG4gICAgbW9tZW50LmRlZmF1bHRGb3JtYXQgPSBpc29Gb3JtYXQ7XHJcblxyXG4gICAgLy8gY29uc3RhbnQgdGhhdCByZWZlcnMgdG8gdGhlIElTTyBzdGFuZGFyZFxyXG4gICAgbW9tZW50LklTT184NjAxID0gZnVuY3Rpb24gKCkge307XHJcblxyXG4gICAgLy8gUGx1Z2lucyB0aGF0IGFkZCBwcm9wZXJ0aWVzIHNob3VsZCBhbHNvIGFkZCB0aGUga2V5IGhlcmUgKG51bGwgdmFsdWUpLFxyXG4gICAgLy8gc28gd2UgY2FuIHByb3Blcmx5IGNsb25lIG91cnNlbHZlcy5cclxuICAgIG1vbWVudC5tb21lbnRQcm9wZXJ0aWVzID0gbW9tZW50UHJvcGVydGllcztcclxuXHJcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHdoZW5ldmVyIGEgbW9tZW50IGlzIG11dGF0ZWQuXHJcbiAgICAvLyBJdCBpcyBpbnRlbmRlZCB0byBrZWVwIHRoZSBvZmZzZXQgaW4gc3luYyB3aXRoIHRoZSB0aW1lem9uZS5cclxuICAgIG1vbWVudC51cGRhdGVPZmZzZXQgPSBmdW5jdGlvbiAoKSB7fTtcclxuXHJcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gc2V0IGEgdGhyZXNob2xkIGZvciByZWxhdGl2ZSB0aW1lIHN0cmluZ3NcclxuICAgIG1vbWVudC5yZWxhdGl2ZVRpbWVUaHJlc2hvbGQgPSBmdW5jdGlvbih0aHJlc2hvbGQsIGxpbWl0KSB7XHJcbiAgICAgIGlmIChyZWxhdGl2ZVRpbWVUaHJlc2hvbGRzW3RocmVzaG9sZF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzW3RocmVzaG9sZF0gPSBsaW1pdDtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxhbmd1YWdlcyBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsYW5ndWFnZS4gIElmXHJcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IGdsb2JhbFxyXG4gICAgLy8gbGFuZ3VhZ2Uga2V5LlxyXG4gICAgbW9tZW50LmxhbmcgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZXMpIHtcclxuICAgICAgICB2YXIgcjtcclxuICAgICAgICBpZiAoIWtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmZuLl9sYW5nLl9hYmJyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodmFsdWVzKSB7XHJcbiAgICAgICAgICAgIGxvYWRMYW5nKG5vcm1hbGl6ZUxhbmd1YWdlKGtleSksIHZhbHVlcyk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZXMgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgdW5sb2FkTGFuZyhrZXkpO1xyXG4gICAgICAgICAgICBrZXkgPSAnZW4nO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIWxhbmd1YWdlc1trZXldKSB7XHJcbiAgICAgICAgICAgIGdldExhbmdEZWZpbml0aW9uKGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHIgPSBtb21lbnQuZHVyYXRpb24uZm4uX2xhbmcgPSBtb21lbnQuZm4uX2xhbmcgPSBnZXRMYW5nRGVmaW5pdGlvbihrZXkpO1xyXG4gICAgICAgIHJldHVybiByLl9hYmJyO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyByZXR1cm5zIGxhbmd1YWdlIGRhdGFcclxuICAgIG1vbWVudC5sYW5nRGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICBpZiAoa2V5ICYmIGtleS5fbGFuZyAmJiBrZXkuX2xhbmcuX2FiYnIpIHtcclxuICAgICAgICAgICAga2V5ID0ga2V5Ll9sYW5nLl9hYmJyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZ2V0TGFuZ0RlZmluaXRpb24oa2V5KTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gY29tcGFyZSBtb21lbnQgb2JqZWN0XHJcbiAgICBtb21lbnQuaXNNb21lbnQgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE1vbWVudCB8fFxyXG4gICAgICAgICAgICAob2JqICE9IG51bGwgJiYgIG9iai5oYXNPd25Qcm9wZXJ0eSgnX2lzQU1vbWVudE9iamVjdCcpKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gZm9yIHR5cGVjaGVja2luZyBEdXJhdGlvbiBvYmplY3RzXHJcbiAgICBtb21lbnQuaXNEdXJhdGlvbiA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRHVyYXRpb247XHJcbiAgICB9O1xyXG5cclxuICAgIGZvciAoaSA9IGxpc3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XHJcbiAgICAgICAgbWFrZUxpc3QobGlzdHNbaV0pO1xyXG4gICAgfVxyXG5cclxuICAgIG1vbWVudC5ub3JtYWxpemVVbml0cyA9IGZ1bmN0aW9uICh1bml0cykge1xyXG4gICAgICAgIHJldHVybiBub3JtYWxpemVVbml0cyh1bml0cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vbWVudC5pbnZhbGlkID0gZnVuY3Rpb24gKGZsYWdzKSB7XHJcbiAgICAgICAgdmFyIG0gPSBtb21lbnQudXRjKE5hTik7XHJcbiAgICAgICAgaWYgKGZsYWdzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgZXh0ZW5kKG0uX3BmLCBmbGFncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBtLl9wZi51c2VySW52YWxpZGF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG07XHJcbiAgICB9O1xyXG5cclxuICAgIG1vbWVudC5wYXJzZVpvbmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG1vbWVudC5hcHBseShudWxsLCBhcmd1bWVudHMpLnBhcnNlWm9uZSgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb21lbnQucGFyc2VUd29EaWdpdFllYXIgPSBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICByZXR1cm4gdG9JbnQoaW5wdXQpICsgKHRvSW50KGlucHV0KSA+IDY4ID8gMTkwMCA6IDIwMDApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgTW9tZW50IFByb3RvdHlwZVxyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgICBleHRlbmQobW9tZW50LmZuID0gTW9tZW50LnByb3RvdHlwZSwge1xyXG5cclxuICAgICAgICBjbG9uZSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB2YWx1ZU9mIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gK3RoaXMuX2QgKyAoKHRoaXMuX29mZnNldCB8fCAwKSAqIDYwMDAwKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB1bml4IDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcigrdGhpcyAvIDEwMDApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSgpLmxhbmcoJ2VuJykuZm9ybWF0KFwiZGRkIE1NTSBERCBZWVlZIEhIOm1tOnNzIFtHTVRdWlpcIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9EYXRlIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb2Zmc2V0ID8gbmV3IERhdGUoK3RoaXMpIDogdGhpcy5fZDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b0lTT1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG0gPSBtb21lbnQodGhpcykudXRjKCk7XHJcbiAgICAgICAgICAgIGlmICgwIDwgbS55ZWFyKCkgJiYgbS55ZWFyKCkgPD0gOTk5OSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b0FycmF5IDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgbSA9IHRoaXM7XHJcbiAgICAgICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICAgICBtLnllYXIoKSxcclxuICAgICAgICAgICAgICAgIG0ubW9udGgoKSxcclxuICAgICAgICAgICAgICAgIG0uZGF0ZSgpLFxyXG4gICAgICAgICAgICAgICAgbS5ob3VycygpLFxyXG4gICAgICAgICAgICAgICAgbS5taW51dGVzKCksXHJcbiAgICAgICAgICAgICAgICBtLnNlY29uZHMoKSxcclxuICAgICAgICAgICAgICAgIG0ubWlsbGlzZWNvbmRzKClcclxuICAgICAgICAgICAgXTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc1ZhbGlkIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNWYWxpZCh0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc0RTVFNoaWZ0ZWQgOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fYSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpICYmIGNvbXBhcmVBcnJheXModGhpcy5fYSwgKHRoaXMuX2lzVVRDID8gbW9tZW50LnV0Yyh0aGlzLl9hKSA6IG1vbWVudCh0aGlzLl9hKSkudG9BcnJheSgpKSA+IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwYXJzaW5nRmxhZ3MgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBleHRlbmQoe30sIHRoaXMuX3BmKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbnZhbGlkQXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BmLm92ZXJmbG93O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHV0YyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuem9uZSgwKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsb2NhbCA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy56b25lKDApO1xyXG4gICAgICAgICAgICB0aGlzLl9pc1VUQyA9IGZhbHNlO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIG91dHB1dCA9IGZvcm1hdE1vbWVudCh0aGlzLCBpbnB1dFN0cmluZyB8fCBtb21lbnQuZGVmYXVsdEZvcm1hdCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5wb3N0Zm9ybWF0KG91dHB1dCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKGlucHV0LCB2YWwpIHtcclxuICAgICAgICAgICAgdmFyIGR1cjtcclxuICAgICAgICAgICAgLy8gc3dpdGNoIGFyZ3MgdG8gc3VwcG9ydCBhZGQoJ3MnLCAxKSBhbmQgYWRkKDEsICdzJylcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpc05hTigrdmFsKSA/ICtpbnB1dCA6ICt2YWwsIGlzTmFOKCt2YWwpID8gdmFsIDogaW5wdXQpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbigrdmFsLCBpbnB1dCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkdXIgPSBtb21lbnQuZHVyYXRpb24oaW5wdXQsIHZhbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudCh0aGlzLCBkdXIsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzdWJ0cmFjdCA6IGZ1bmN0aW9uIChpbnB1dCwgdmFsKSB7XHJcbiAgICAgICAgICAgIHZhciBkdXI7XHJcbiAgICAgICAgICAgIC8vIHN3aXRjaCBhcmdzIHRvIHN1cHBvcnQgc3VidHJhY3QoJ3MnLCAxKSBhbmQgc3VidHJhY3QoMSwgJ3MnKVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgZHVyID0gbW9tZW50LmR1cmF0aW9uKGlzTmFOKCt2YWwpID8gK2lucHV0IDogK3ZhbCwgaXNOYU4oK3ZhbCkgPyB2YWwgOiBpbnB1dCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgZHVyID0gbW9tZW50LmR1cmF0aW9uKCt2YWwsIGlucHV0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhZGRPclN1YnRyYWN0RHVyYXRpb25Gcm9tTW9tZW50KHRoaXMsIGR1ciwgLTEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBkaWZmIDogZnVuY3Rpb24gKGlucHV0LCB1bml0cywgYXNGbG9hdCkge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IG1ha2VBcyhpbnB1dCwgdGhpcyksXHJcbiAgICAgICAgICAgICAgICB6b25lRGlmZiA9ICh0aGlzLnpvbmUoKSAtIHRoYXQuem9uZSgpKSAqIDZlNCxcclxuICAgICAgICAgICAgICAgIGRpZmYsIG91dHB1dDtcclxuXHJcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHVuaXRzID09PSAneWVhcicgfHwgdW5pdHMgPT09ICdtb250aCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIGF2ZXJhZ2UgbnVtYmVyIG9mIGRheXMgaW4gdGhlIG1vbnRocyBpbiB0aGUgZ2l2ZW4gZGF0ZXNcclxuICAgICAgICAgICAgICAgIGRpZmYgPSAodGhpcy5kYXlzSW5Nb250aCgpICsgdGhhdC5kYXlzSW5Nb250aCgpKSAqIDQzMmU1OyAvLyAyNCAqIDYwICogNjAgKiAxMDAwIC8gMlxyXG4gICAgICAgICAgICAgICAgLy8gZGlmZmVyZW5jZSBpbiBtb250aHNcclxuICAgICAgICAgICAgICAgIG91dHB1dCA9ICgodGhpcy55ZWFyKCkgLSB0aGF0LnllYXIoKSkgKiAxMikgKyAodGhpcy5tb250aCgpIC0gdGhhdC5tb250aCgpKTtcclxuICAgICAgICAgICAgICAgIC8vIGFkanVzdCBieSB0YWtpbmcgZGlmZmVyZW5jZSBpbiBkYXlzLCBhdmVyYWdlIG51bWJlciBvZiBkYXlzXHJcbiAgICAgICAgICAgICAgICAvLyBhbmQgZHN0IGluIHRoZSBnaXZlbiBtb250aHMuXHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gKCh0aGlzIC0gbW9tZW50KHRoaXMpLnN0YXJ0T2YoJ21vbnRoJykpIC1cclxuICAgICAgICAgICAgICAgICAgICAgICAgKHRoYXQgLSBtb21lbnQodGhhdCkuc3RhcnRPZignbW9udGgnKSkpIC8gZGlmZjtcclxuICAgICAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdpdGggem9uZXMsIHRvIG5lZ2F0ZSBhbGwgZHN0XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgLT0gKCh0aGlzLnpvbmUoKSAtIG1vbWVudCh0aGlzKS5zdGFydE9mKCdtb250aCcpLnpvbmUoKSkgLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAodGhhdC56b25lKCkgLSBtb21lbnQodGhhdCkuc3RhcnRPZignbW9udGgnKS56b25lKCkpKSAqIDZlNCAvIGRpZmY7XHJcbiAgICAgICAgICAgICAgICBpZiAodW5pdHMgPT09ICd5ZWFyJykge1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCAvIDEyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGlmZiA9ICh0aGlzIC0gdGhhdCk7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSB1bml0cyA9PT0gJ3NlY29uZCcgPyBkaWZmIC8gMWUzIDogLy8gMTAwMFxyXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnbWludXRlJyA/IGRpZmYgLyA2ZTQgOiAvLyAxMDAwICogNjBcclxuICAgICAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ2hvdXInID8gZGlmZiAvIDM2ZTUgOiAvLyAxMDAwICogNjAgKiA2MFxyXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnZGF5JyA/IChkaWZmIC0gem9uZURpZmYpIC8gODY0ZTUgOiAvLyAxMDAwICogNjAgKiA2MCAqIDI0LCBuZWdhdGUgZHN0XHJcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICd3ZWVrJyA/IChkaWZmIC0gem9uZURpZmYpIC8gNjA0OGU1IDogLy8gMTAwMCAqIDYwICogNjAgKiAyNCAqIDcsIG5lZ2F0ZSBkc3RcclxuICAgICAgICAgICAgICAgICAgICBkaWZmO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhc0Zsb2F0ID8gb3V0cHV0IDogYWJzUm91bmQob3V0cHV0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmcm9tIDogZnVuY3Rpb24gKHRpbWUsIHdpdGhvdXRTdWZmaXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudC5kdXJhdGlvbih0aGlzLmRpZmYodGltZSkpLmxhbmcodGhpcy5sYW5nKCkuX2FiYnIpLmh1bWFuaXplKCF3aXRob3V0U3VmZml4KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmcm9tTm93IDogZnVuY3Rpb24gKHdpdGhvdXRTdWZmaXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnJvbShtb21lbnQoKSwgd2l0aG91dFN1ZmZpeCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY2FsZW5kYXIgOiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgICAgICAvLyBXZSB3YW50IHRvIGNvbXBhcmUgdGhlIHN0YXJ0IG9mIHRvZGF5LCB2cyB0aGlzLlxyXG4gICAgICAgICAgICAvLyBHZXR0aW5nIHN0YXJ0LW9mLXRvZGF5IGRlcGVuZHMgb24gd2hldGhlciB3ZSdyZSB6b25lJ2Qgb3Igbm90LlxyXG4gICAgICAgICAgICB2YXIgbm93ID0gdGltZSB8fCBtb21lbnQoKSxcclxuICAgICAgICAgICAgICAgIHNvZCA9IG1ha2VBcyhub3csIHRoaXMpLnN0YXJ0T2YoJ2RheScpLFxyXG4gICAgICAgICAgICAgICAgZGlmZiA9IHRoaXMuZGlmZihzb2QsICdkYXlzJywgdHJ1ZSksXHJcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBkaWZmIDwgLTYgPyAnc2FtZUVsc2UnIDpcclxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgLTEgPyAnbGFzdFdlZWsnIDpcclxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgMCA/ICdsYXN0RGF5JyA6XHJcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IDEgPyAnc2FtZURheScgOlxyXG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAyID8gJ25leHREYXknIDpcclxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgNyA/ICduZXh0V2VlaycgOiAnc2FtZUVsc2UnO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXQodGhpcy5sYW5nKCkuY2FsZW5kYXIoZm9ybWF0LCB0aGlzKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNMZWFwWWVhciA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzTGVhcFllYXIodGhpcy55ZWFyKCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzRFNUIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuem9uZSgpIDwgdGhpcy5jbG9uZSgpLm1vbnRoKDApLnpvbmUoKSB8fFxyXG4gICAgICAgICAgICAgICAgdGhpcy56b25lKCkgPCB0aGlzLmNsb25lKCkubW9udGgoNSkuem9uZSgpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBkYXkgOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgdmFyIGRheSA9IHRoaXMuX2lzVVRDID8gdGhpcy5fZC5nZXRVVENEYXkoKSA6IHRoaXMuX2QuZ2V0RGF5KCk7XHJcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpbnB1dCA9IHBhcnNlV2Vla2RheShpbnB1dCwgdGhpcy5sYW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHsgZCA6IGlucHV0IC0gZGF5IH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRheTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG1vbnRoIDogbWFrZUFjY2Vzc29yKCdNb250aCcsIHRydWUpLFxyXG5cclxuICAgICAgICBzdGFydE9mOiBmdW5jdGlvbiAodW5pdHMpIHtcclxuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XHJcbiAgICAgICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgc3dpdGNoIGludGVudGlvbmFsbHkgb21pdHMgYnJlYWsga2V5d29yZHNcclxuICAgICAgICAgICAgLy8gdG8gdXRpbGl6ZSBmYWxsaW5nIHRocm91Z2ggdGhlIGNhc2VzLlxyXG4gICAgICAgICAgICBzd2l0Y2ggKHVuaXRzKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3llYXInOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5tb250aCgwKTtcclxuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICAgICAgY2FzZSAncXVhcnRlcic6XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRoJzpcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSgxKTtcclxuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICAgICAgY2FzZSAnd2Vlayc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2lzb1dlZWsnOlxyXG4gICAgICAgICAgICBjYXNlICdkYXknOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5ob3VycygwKTtcclxuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICAgICAgY2FzZSAnaG91cic6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbnV0ZXMoMCk7XHJcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgICAgIGNhc2UgJ21pbnV0ZSc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlY29uZHMoMCk7XHJcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgICAgIGNhc2UgJ3NlY29uZCc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbGxpc2Vjb25kcygwKTtcclxuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gd2Vla3MgYXJlIGEgc3BlY2lhbCBjYXNlXHJcbiAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ3dlZWsnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndlZWtkYXkoMCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodW5pdHMgPT09ICdpc29XZWVrJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc29XZWVrZGF5KDEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBxdWFydGVycyBhcmUgYWxzbyBzcGVjaWFsXHJcbiAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vbnRoKE1hdGguZmxvb3IodGhpcy5tb250aCgpIC8gMykgKiAzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZW5kT2Y6IGZ1bmN0aW9uICh1bml0cykge1xyXG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnRPZih1bml0cykuYWRkKCh1bml0cyA9PT0gJ2lzb1dlZWsnID8gJ3dlZWsnIDogdW5pdHMpLCAxKS5zdWJ0cmFjdCgnbXMnLCAxKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc0FmdGVyOiBmdW5jdGlvbiAoaW5wdXQsIHVuaXRzKSB7XHJcbiAgICAgICAgICAgIHVuaXRzID0gdHlwZW9mIHVuaXRzICE9PSAndW5kZWZpbmVkJyA/IHVuaXRzIDogJ21pbGxpc2Vjb25kJztcclxuICAgICAgICAgICAgcmV0dXJuICt0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykgPiArbW9tZW50KGlucHV0KS5zdGFydE9mKHVuaXRzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc0JlZm9yZTogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xyXG4gICAgICAgICAgICB1bml0cyA9IHR5cGVvZiB1bml0cyAhPT0gJ3VuZGVmaW5lZCcgPyB1bml0cyA6ICdtaWxsaXNlY29uZCc7XHJcbiAgICAgICAgICAgIHJldHVybiArdGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpIDwgK21vbWVudChpbnB1dCkuc3RhcnRPZih1bml0cyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNTYW1lOiBmdW5jdGlvbiAoaW5wdXQsIHVuaXRzKSB7XHJcbiAgICAgICAgICAgIHVuaXRzID0gdW5pdHMgfHwgJ21zJztcclxuICAgICAgICAgICAgcmV0dXJuICt0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykgPT09ICttYWtlQXMoaW5wdXQsIHRoaXMpLnN0YXJ0T2YodW5pdHMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG1pbjogZGVwcmVjYXRlKFxyXG4gICAgICAgICAgICAgICAgIFwibW9tZW50KCkubWluIGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQubWluIGluc3RlYWQuIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNTQ4XCIsXHJcbiAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKG90aGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgIG90aGVyID0gbW9tZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvdGhlciA8IHRoaXMgPyB0aGlzIDogb3RoZXI7XHJcbiAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICApLFxyXG5cclxuICAgICAgICBtYXg6IGRlcHJlY2F0ZShcclxuICAgICAgICAgICAgICAgIFwibW9tZW50KCkubWF4IGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQubWF4IGluc3RlYWQuIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNTQ4XCIsXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAob3RoZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBvdGhlciA9IG1vbWVudC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdGhlciA+IHRoaXMgPyB0aGlzIDogb3RoZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgKSxcclxuXHJcbiAgICAgICAgLy8ga2VlcFRpbWUgPSB0cnVlIG1lYW5zIG9ubHkgY2hhbmdlIHRoZSB0aW1lem9uZSwgd2l0aG91dCBhZmZlY3RpbmdcclxuICAgICAgICAvLyB0aGUgbG9jYWwgaG91ci4gU28gNTozMToyNiArMDMwMCAtLVt6b25lKDIsIHRydWUpXS0tPiA1OjMxOjI2ICswMjAwXHJcbiAgICAgICAgLy8gSXQgaXMgcG9zc2libGUgdGhhdCA1OjMxOjI2IGRvZXNuJ3QgZXhpc3QgaW50IHpvbmUgKzAyMDAsIHNvIHdlXHJcbiAgICAgICAgLy8gYWRqdXN0IHRoZSB0aW1lIGFzIG5lZWRlZCwgdG8gYmUgdmFsaWQuXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBLZWVwaW5nIHRoZSB0aW1lIGFjdHVhbGx5IGFkZHMvc3VidHJhY3RzIChvbmUgaG91cilcclxuICAgICAgICAvLyBmcm9tIHRoZSBhY3R1YWwgcmVwcmVzZW50ZWQgdGltZS4gVGhhdCBpcyB3aHkgd2UgY2FsbCB1cGRhdGVPZmZzZXRcclxuICAgICAgICAvLyBhIHNlY29uZCB0aW1lLiBJbiBjYXNlIGl0IHdhbnRzIHVzIHRvIGNoYW5nZSB0aGUgb2Zmc2V0IGFnYWluXHJcbiAgICAgICAgLy8gX2NoYW5nZUluUHJvZ3Jlc3MgPT0gdHJ1ZSBjYXNlLCB0aGVuIHdlIGhhdmUgdG8gYWRqdXN0LCBiZWNhdXNlXHJcbiAgICAgICAgLy8gdGhlcmUgaXMgbm8gc3VjaCB0aW1lIGluIHRoZSBnaXZlbiB0aW1lem9uZS5cclxuICAgICAgICB6b25lIDogZnVuY3Rpb24gKGlucHV0LCBrZWVwVGltZSkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5fb2Zmc2V0IHx8IDA7XHJcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSB0aW1lem9uZU1pbnV0ZXNGcm9tU3RyaW5nKGlucHV0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhpbnB1dCkgPCAxNikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gaW5wdXQgKiA2MDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuX29mZnNldCA9IGlucHV0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5faXNVVEMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCAhPT0gaW5wdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWtlZXBUaW1lIHx8IHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudCh0aGlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vbWVudC5kdXJhdGlvbihvZmZzZXQgLSBpbnB1dCwgJ20nKSwgMSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQodGhpcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/IG9mZnNldCA6IHRoaXMuX2QuZ2V0VGltZXpvbmVPZmZzZXQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB6b25lQWJiciA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gXCJVVENcIiA6IFwiXCI7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgem9uZU5hbWUgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/IFwiQ29vcmRpbmF0ZWQgVW5pdmVyc2FsIFRpbWVcIiA6IFwiXCI7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcGFyc2Vab25lIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fdHptKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnpvbmUodGhpcy5fdHptKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5faSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuem9uZSh0aGlzLl9pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoYXNBbGlnbmVkSG91ck9mZnNldCA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICBpZiAoIWlucHV0KSB7XHJcbiAgICAgICAgICAgICAgICBpbnB1dCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpbnB1dCA9IG1vbWVudChpbnB1dCkuem9uZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuem9uZSgpIC0gaW5wdXQpICUgNjAgPT09IDA7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZGF5c0luTW9udGggOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXlzSW5Nb250aCh0aGlzLnllYXIoKSwgdGhpcy5tb250aCgpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBkYXlPZlllYXIgOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgdmFyIGRheU9mWWVhciA9IHJvdW5kKChtb21lbnQodGhpcykuc3RhcnRPZignZGF5JykgLSBtb21lbnQodGhpcykuc3RhcnRPZigneWVhcicpKSAvIDg2NGU1KSArIDE7XHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gZGF5T2ZZZWFyIDogdGhpcy5hZGQoXCJkXCIsIChpbnB1dCAtIGRheU9mWWVhcikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHF1YXJ0ZXIgOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBNYXRoLmNlaWwoKHRoaXMubW9udGgoKSArIDEpIC8gMykgOiB0aGlzLm1vbnRoKChpbnB1dCAtIDEpICogMyArIHRoaXMubW9udGgoKSAlIDMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHdlZWtZZWFyIDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIHZhciB5ZWFyID0gd2Vla09mWWVhcih0aGlzLCB0aGlzLmxhbmcoKS5fd2Vlay5kb3csIHRoaXMubGFuZygpLl93ZWVrLmRveSkueWVhcjtcclxuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB5ZWFyIDogdGhpcy5hZGQoXCJ5XCIsIChpbnB1dCAtIHllYXIpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc29XZWVrWWVhciA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICB2YXIgeWVhciA9IHdlZWtPZlllYXIodGhpcywgMSwgNCkueWVhcjtcclxuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB5ZWFyIDogdGhpcy5hZGQoXCJ5XCIsIChpbnB1dCAtIHllYXIpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB3ZWVrIDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIHZhciB3ZWVrID0gdGhpcy5sYW5nKCkud2Vlayh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoXCJkXCIsIChpbnB1dCAtIHdlZWspICogNyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNvV2VlayA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICB2YXIgd2VlayA9IHdlZWtPZlllYXIodGhpcywgMSwgNCkud2VlaztcclxuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoXCJkXCIsIChpbnB1dCAtIHdlZWspICogNyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgd2Vla2RheSA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICB2YXIgd2Vla2RheSA9ICh0aGlzLmRheSgpICsgNyAtIHRoaXMubGFuZygpLl93ZWVrLmRvdykgJSA3O1xyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWtkYXkgOiB0aGlzLmFkZChcImRcIiwgaW5wdXQgLSB3ZWVrZGF5KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc29XZWVrZGF5IDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIC8vIGJlaGF2ZXMgdGhlIHNhbWUgYXMgbW9tZW50I2RheSBleGNlcHRcclxuICAgICAgICAgICAgLy8gYXMgYSBnZXR0ZXIsIHJldHVybnMgNyBpbnN0ZWFkIG9mIDAgKDEtNyByYW5nZSBpbnN0ZWFkIG9mIDAtNilcclxuICAgICAgICAgICAgLy8gYXMgYSBzZXR0ZXIsIHN1bmRheSBzaG91bGQgYmVsb25nIHRvIHRoZSBwcmV2aW91cyB3ZWVrLlxyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHRoaXMuZGF5KCkgfHwgNyA6IHRoaXMuZGF5KHRoaXMuZGF5KCkgJSA3ID8gaW5wdXQgOiBpbnB1dCAtIDcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzb1dlZWtzSW5ZZWFyIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2Vla3NJblllYXIodGhpcy55ZWFyKCksIDEsIDQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHdlZWtzSW5ZZWFyIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgd2Vla0luZm8gPSB0aGlzLl9sYW5nLl93ZWVrO1xyXG4gICAgICAgICAgICByZXR1cm4gd2Vla3NJblllYXIodGhpcy55ZWFyKCksIHdlZWtJbmZvLmRvdywgd2Vla0luZm8uZG95KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBnZXQgOiBmdW5jdGlvbiAodW5pdHMpIHtcclxuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzXSgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldCA6IGZ1bmN0aW9uICh1bml0cywgdmFsdWUpIHtcclxuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpc1t1bml0c10gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbdW5pdHNdKHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyBJZiBwYXNzZWQgYSBsYW5ndWFnZSBrZXksIGl0IHdpbGwgc2V0IHRoZSBsYW5ndWFnZSBmb3IgdGhpc1xyXG4gICAgICAgIC8vIGluc3RhbmNlLiAgT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiB0aGUgbGFuZ3VhZ2UgY29uZmlndXJhdGlvblxyXG4gICAgICAgIC8vIHZhcmlhYmxlcyBmb3IgdGhpcyBpbnN0YW5jZS5cclxuICAgICAgICBsYW5nIDogZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9sYW5nO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGtleSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJhd01vbnRoU2V0dGVyKG1vbSwgdmFsdWUpIHtcclxuICAgICAgICB2YXIgZGF5T2ZNb250aDtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogTW92ZSB0aGlzIG91dCBvZiBoZXJlIVxyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gbW9tLmxhbmcoKS5tb250aHNQYXJzZSh2YWx1ZSk7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IEFub3RoZXIgc2lsZW50IGZhaWx1cmU/XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9tO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkYXlPZk1vbnRoID0gTWF0aC5taW4obW9tLmRhdGUoKSxcclxuICAgICAgICAgICAgICAgIGRheXNJbk1vbnRoKG1vbS55ZWFyKCksIHZhbHVlKSk7XHJcbiAgICAgICAgbW9tLl9kWydzZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArICdNb250aCddKHZhbHVlLCBkYXlPZk1vbnRoKTtcclxuICAgICAgICByZXR1cm4gbW9tO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJhd0dldHRlcihtb20sIHVuaXQpIHtcclxuICAgICAgICByZXR1cm4gbW9tLl9kWydnZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArIHVuaXRdKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmF3U2V0dGVyKG1vbSwgdW5pdCwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodW5pdCA9PT0gJ01vbnRoJykge1xyXG4gICAgICAgICAgICByZXR1cm4gcmF3TW9udGhTZXR0ZXIobW9tLCB2YWx1ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VBY2Nlc3Nvcih1bml0LCBrZWVwVGltZSkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJhd1NldHRlcih0aGlzLCB1bml0LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBtb21lbnQudXBkYXRlT2Zmc2V0KHRoaXMsIGtlZXBUaW1lKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhd0dldHRlcih0aGlzLCB1bml0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgbW9tZW50LmZuLm1pbGxpc2Vjb25kID0gbW9tZW50LmZuLm1pbGxpc2Vjb25kcyA9IG1ha2VBY2Nlc3NvcignTWlsbGlzZWNvbmRzJywgZmFsc2UpO1xyXG4gICAgbW9tZW50LmZuLnNlY29uZCA9IG1vbWVudC5mbi5zZWNvbmRzID0gbWFrZUFjY2Vzc29yKCdTZWNvbmRzJywgZmFsc2UpO1xyXG4gICAgbW9tZW50LmZuLm1pbnV0ZSA9IG1vbWVudC5mbi5taW51dGVzID0gbWFrZUFjY2Vzc29yKCdNaW51dGVzJywgZmFsc2UpO1xyXG4gICAgLy8gU2V0dGluZyB0aGUgaG91ciBzaG91bGQga2VlcCB0aGUgdGltZSwgYmVjYXVzZSB0aGUgdXNlciBleHBsaWNpdGx5XHJcbiAgICAvLyBzcGVjaWZpZWQgd2hpY2ggaG91ciBoZSB3YW50cy4gU28gdHJ5aW5nIHRvIG1haW50YWluIHRoZSBzYW1lIGhvdXIgKGluXHJcbiAgICAvLyBhIG5ldyB0aW1lem9uZSkgbWFrZXMgc2Vuc2UuIEFkZGluZy9zdWJ0cmFjdGluZyBob3VycyBkb2VzIG5vdCBmb2xsb3dcclxuICAgIC8vIHRoaXMgcnVsZS5cclxuICAgIG1vbWVudC5mbi5ob3VyID0gbW9tZW50LmZuLmhvdXJzID0gbWFrZUFjY2Vzc29yKCdIb3VycycsIHRydWUpO1xyXG4gICAgLy8gbW9tZW50LmZuLm1vbnRoIGlzIGRlZmluZWQgc2VwYXJhdGVseVxyXG4gICAgbW9tZW50LmZuLmRhdGUgPSBtYWtlQWNjZXNzb3IoJ0RhdGUnLCB0cnVlKTtcclxuICAgIG1vbWVudC5mbi5kYXRlcyA9IGRlcHJlY2F0ZShcImRhdGVzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSBkYXRlIGluc3RlYWQuXCIsIG1ha2VBY2Nlc3NvcignRGF0ZScsIHRydWUpKTtcclxuICAgIG1vbWVudC5mbi55ZWFyID0gbWFrZUFjY2Vzc29yKCdGdWxsWWVhcicsIHRydWUpO1xyXG4gICAgbW9tZW50LmZuLnllYXJzID0gZGVwcmVjYXRlKFwieWVhcnMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIHllYXIgaW5zdGVhZC5cIiwgbWFrZUFjY2Vzc29yKCdGdWxsWWVhcicsIHRydWUpKTtcclxuXHJcbiAgICAvLyBhZGQgcGx1cmFsIG1ldGhvZHNcclxuICAgIG1vbWVudC5mbi5kYXlzID0gbW9tZW50LmZuLmRheTtcclxuICAgIG1vbWVudC5mbi5tb250aHMgPSBtb21lbnQuZm4ubW9udGg7XHJcbiAgICBtb21lbnQuZm4ud2Vla3MgPSBtb21lbnQuZm4ud2VlaztcclxuICAgIG1vbWVudC5mbi5pc29XZWVrcyA9IG1vbWVudC5mbi5pc29XZWVrO1xyXG4gICAgbW9tZW50LmZuLnF1YXJ0ZXJzID0gbW9tZW50LmZuLnF1YXJ0ZXI7XHJcblxyXG4gICAgLy8gYWRkIGFsaWFzZWQgZm9ybWF0IG1ldGhvZHNcclxuICAgIG1vbWVudC5mbi50b0pTT04gPSBtb21lbnQuZm4udG9JU09TdHJpbmc7XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIER1cmF0aW9uIFByb3RvdHlwZVxyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgICBleHRlbmQobW9tZW50LmR1cmF0aW9uLmZuID0gRHVyYXRpb24ucHJvdG90eXBlLCB7XHJcblxyXG4gICAgICAgIF9idWJibGUgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBtaWxsaXNlY29uZHMgPSB0aGlzLl9taWxsaXNlY29uZHMsXHJcbiAgICAgICAgICAgICAgICBkYXlzID0gdGhpcy5fZGF5cyxcclxuICAgICAgICAgICAgICAgIG1vbnRocyA9IHRoaXMuX21vbnRocyxcclxuICAgICAgICAgICAgICAgIGRhdGEgPSB0aGlzLl9kYXRhLFxyXG4gICAgICAgICAgICAgICAgc2Vjb25kcywgbWludXRlcywgaG91cnMsIHllYXJzO1xyXG5cclxuICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjb2RlIGJ1YmJsZXMgdXAgdmFsdWVzLCBzZWUgdGhlIHRlc3RzIGZvclxyXG4gICAgICAgICAgICAvLyBleGFtcGxlcyBvZiB3aGF0IHRoYXQgbWVhbnMuXHJcbiAgICAgICAgICAgIGRhdGEubWlsbGlzZWNvbmRzID0gbWlsbGlzZWNvbmRzICUgMTAwMDtcclxuXHJcbiAgICAgICAgICAgIHNlY29uZHMgPSBhYnNSb3VuZChtaWxsaXNlY29uZHMgLyAxMDAwKTtcclxuICAgICAgICAgICAgZGF0YS5zZWNvbmRzID0gc2Vjb25kcyAlIDYwO1xyXG5cclxuICAgICAgICAgICAgbWludXRlcyA9IGFic1JvdW5kKHNlY29uZHMgLyA2MCk7XHJcbiAgICAgICAgICAgIGRhdGEubWludXRlcyA9IG1pbnV0ZXMgJSA2MDtcclxuXHJcbiAgICAgICAgICAgIGhvdXJzID0gYWJzUm91bmQobWludXRlcyAvIDYwKTtcclxuICAgICAgICAgICAgZGF0YS5ob3VycyA9IGhvdXJzICUgMjQ7XHJcblxyXG4gICAgICAgICAgICBkYXlzICs9IGFic1JvdW5kKGhvdXJzIC8gMjQpO1xyXG4gICAgICAgICAgICBkYXRhLmRheXMgPSBkYXlzICUgMzA7XHJcblxyXG4gICAgICAgICAgICBtb250aHMgKz0gYWJzUm91bmQoZGF5cyAvIDMwKTtcclxuICAgICAgICAgICAgZGF0YS5tb250aHMgPSBtb250aHMgJSAxMjtcclxuXHJcbiAgICAgICAgICAgIHllYXJzID0gYWJzUm91bmQobW9udGhzIC8gMTIpO1xyXG4gICAgICAgICAgICBkYXRhLnllYXJzID0geWVhcnM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgd2Vla3MgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhYnNSb3VuZCh0aGlzLmRheXMoKSAvIDcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlT2YgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9taWxsaXNlY29uZHMgK1xyXG4gICAgICAgICAgICAgIHRoaXMuX2RheXMgKiA4NjRlNSArXHJcbiAgICAgICAgICAgICAgKHRoaXMuX21vbnRocyAlIDEyKSAqIDI1OTJlNiArXHJcbiAgICAgICAgICAgICAgdG9JbnQodGhpcy5fbW9udGhzIC8gMTIpICogMzE1MzZlNjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBodW1hbml6ZSA6IGZ1bmN0aW9uICh3aXRoU3VmZml4KSB7XHJcbiAgICAgICAgICAgIHZhciBkaWZmZXJlbmNlID0gK3RoaXMsXHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSByZWxhdGl2ZVRpbWUoZGlmZmVyZW5jZSwgIXdpdGhTdWZmaXgsIHRoaXMubGFuZygpKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh3aXRoU3VmZml4KSB7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSB0aGlzLmxhbmcoKS5wYXN0RnV0dXJlKGRpZmZlcmVuY2UsIG91dHB1dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5wb3N0Zm9ybWF0KG91dHB1dCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKGlucHV0LCB2YWwpIHtcclxuICAgICAgICAgICAgLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgYWRkKDEsICdzJykgb3IgYWRkKG1vbWVudClcclxuICAgICAgICAgICAgdmFyIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyArPSBkdXIuX21pbGxpc2Vjb25kcztcclxuICAgICAgICAgICAgdGhpcy5fZGF5cyArPSBkdXIuX2RheXM7XHJcbiAgICAgICAgICAgIHRoaXMuX21vbnRocyArPSBkdXIuX21vbnRocztcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2J1YmJsZSgpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc3VidHJhY3QgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xyXG4gICAgICAgICAgICB2YXIgZHVyID0gbW9tZW50LmR1cmF0aW9uKGlucHV0LCB2YWwpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzIC09IGR1ci5fbWlsbGlzZWNvbmRzO1xyXG4gICAgICAgICAgICB0aGlzLl9kYXlzIC09IGR1ci5fZGF5cztcclxuICAgICAgICAgICAgdGhpcy5fbW9udGhzIC09IGR1ci5fbW9udGhzO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYnViYmxlKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBnZXQgOiBmdW5jdGlvbiAodW5pdHMpIHtcclxuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzLnRvTG93ZXJDYXNlKCkgKyAncyddKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYXMgOiBmdW5jdGlvbiAodW5pdHMpIHtcclxuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzWydhcycgKyB1bml0cy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHVuaXRzLnNsaWNlKDEpICsgJ3MnXSgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGxhbmcgOiBtb21lbnQuZm4ubGFuZyxcclxuXHJcbiAgICAgICAgdG9Jc29TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIGluc3BpcmVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9kb3JkaWxsZS9tb21lbnQtaXNvZHVyYXRpb24vYmxvYi9tYXN0ZXIvbW9tZW50Lmlzb2R1cmF0aW9uLmpzXHJcbiAgICAgICAgICAgIHZhciB5ZWFycyA9IE1hdGguYWJzKHRoaXMueWVhcnMoKSksXHJcbiAgICAgICAgICAgICAgICBtb250aHMgPSBNYXRoLmFicyh0aGlzLm1vbnRocygpKSxcclxuICAgICAgICAgICAgICAgIGRheXMgPSBNYXRoLmFicyh0aGlzLmRheXMoKSksXHJcbiAgICAgICAgICAgICAgICBob3VycyA9IE1hdGguYWJzKHRoaXMuaG91cnMoKSksXHJcbiAgICAgICAgICAgICAgICBtaW51dGVzID0gTWF0aC5hYnModGhpcy5taW51dGVzKCkpLFxyXG4gICAgICAgICAgICAgICAgc2Vjb25kcyA9IE1hdGguYWJzKHRoaXMuc2Vjb25kcygpICsgdGhpcy5taWxsaXNlY29uZHMoKSAvIDEwMDApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFzU2Vjb25kcygpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIHRoZSBzYW1lIGFzIEMjJ3MgKE5vZGEpIGFuZCBweXRob24gKGlzb2RhdGUpLi4uXHJcbiAgICAgICAgICAgICAgICAvLyBidXQgbm90IG90aGVyIEpTIChnb29nLmRhdGUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1AwRCc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5hc1NlY29uZHMoKSA8IDAgPyAnLScgOiAnJykgK1xyXG4gICAgICAgICAgICAgICAgJ1AnICtcclxuICAgICAgICAgICAgICAgICh5ZWFycyA/IHllYXJzICsgJ1knIDogJycpICtcclxuICAgICAgICAgICAgICAgIChtb250aHMgPyBtb250aHMgKyAnTScgOiAnJykgK1xyXG4gICAgICAgICAgICAgICAgKGRheXMgPyBkYXlzICsgJ0QnIDogJycpICtcclxuICAgICAgICAgICAgICAgICgoaG91cnMgfHwgbWludXRlcyB8fCBzZWNvbmRzKSA/ICdUJyA6ICcnKSArXHJcbiAgICAgICAgICAgICAgICAoaG91cnMgPyBob3VycyArICdIJyA6ICcnKSArXHJcbiAgICAgICAgICAgICAgICAobWludXRlcyA/IG1pbnV0ZXMgKyAnTScgOiAnJykgK1xyXG4gICAgICAgICAgICAgICAgKHNlY29uZHMgPyBzZWNvbmRzICsgJ1MnIDogJycpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VEdXJhdGlvbkdldHRlcihuYW1lKSB7XHJcbiAgICAgICAgbW9tZW50LmR1cmF0aW9uLmZuW25hbWVdID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtuYW1lXTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VEdXJhdGlvbkFzR2V0dGVyKG5hbWUsIGZhY3Rvcikge1xyXG4gICAgICAgIG1vbWVudC5kdXJhdGlvbi5mblsnYXMnICsgbmFtZV0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiArdGhpcyAvIGZhY3RvcjtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoaSBpbiB1bml0TWlsbGlzZWNvbmRGYWN0b3JzKSB7XHJcbiAgICAgICAgaWYgKHVuaXRNaWxsaXNlY29uZEZhY3RvcnMuaGFzT3duUHJvcGVydHkoaSkpIHtcclxuICAgICAgICAgICAgbWFrZUR1cmF0aW9uQXNHZXR0ZXIoaSwgdW5pdE1pbGxpc2Vjb25kRmFjdG9yc1tpXSk7XHJcbiAgICAgICAgICAgIG1ha2VEdXJhdGlvbkdldHRlcihpLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtYWtlRHVyYXRpb25Bc0dldHRlcignV2Vla3MnLCA2MDQ4ZTUpO1xyXG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmFzTW9udGhzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoK3RoaXMgLSB0aGlzLnllYXJzKCkgKiAzMTUzNmU2KSAvIDI1OTJlNiArIHRoaXMueWVhcnMoKSAqIDEyO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIERlZmF1bHQgTGFuZ1xyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgICAvLyBTZXQgZGVmYXVsdCBsYW5ndWFnZSwgb3RoZXIgbGFuZ3VhZ2VzIHdpbGwgaW5oZXJpdCBmcm9tIEVuZ2xpc2guXHJcbiAgICBtb21lbnQubGFuZygnZW4nLCB7XHJcbiAgICAgICAgb3JkaW5hbCA6IGZ1bmN0aW9uIChudW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIGIgPSBudW1iZXIgJSAxMCxcclxuICAgICAgICAgICAgICAgIG91dHB1dCA9ICh0b0ludChudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gJ3RoJyA6XHJcbiAgICAgICAgICAgICAgICAoYiA9PT0gMSkgPyAnc3QnIDpcclxuICAgICAgICAgICAgICAgIChiID09PSAyKSA/ICduZCcgOlxyXG4gICAgICAgICAgICAgICAgKGIgPT09IDMpID8gJ3JkJyA6ICd0aCc7XHJcbiAgICAgICAgICAgIHJldHVybiBudW1iZXIgKyBvdXRwdXQ7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLyogRU1CRURfTEFOR1VBR0VTICovXHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIEV4cG9zaW5nIE1vbWVudFxyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VHbG9iYWwoc2hvdWxkRGVwcmVjYXRlKSB7XHJcbiAgICAgICAgLypnbG9iYWwgZW5kZXI6ZmFsc2UgKi9cclxuICAgICAgICBpZiAodHlwZW9mIGVuZGVyICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9sZEdsb2JhbE1vbWVudCA9IGdsb2JhbFNjb3BlLm1vbWVudDtcclxuICAgICAgICBpZiAoc2hvdWxkRGVwcmVjYXRlKSB7XHJcbiAgICAgICAgICAgIGdsb2JhbFNjb3BlLm1vbWVudCA9IGRlcHJlY2F0ZShcclxuICAgICAgICAgICAgICAgICAgICBcIkFjY2Vzc2luZyBNb21lbnQgdGhyb3VnaCB0aGUgZ2xvYmFsIHNjb3BlIGlzIFwiICtcclxuICAgICAgICAgICAgICAgICAgICBcImRlcHJlY2F0ZWQsIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYW4gdXBjb21pbmcgXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIFwicmVsZWFzZS5cIixcclxuICAgICAgICAgICAgICAgICAgICBtb21lbnQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGdsb2JhbFNjb3BlLm1vbWVudCA9IG1vbWVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29tbW9uSlMgbW9kdWxlIGlzIGRlZmluZWRcclxuICAgIGlmIChoYXNNb2R1bGUpIHtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IG1vbWVudDtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoXCJtb21lbnRcIiwgZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xyXG4gICAgICAgICAgICBpZiAobW9kdWxlLmNvbmZpZyAmJiBtb2R1bGUuY29uZmlnKCkgJiYgbW9kdWxlLmNvbmZpZygpLm5vR2xvYmFsID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZWxlYXNlIHRoZSBnbG9iYWwgdmFyaWFibGVcclxuICAgICAgICAgICAgICAgIGdsb2JhbFNjb3BlLm1vbWVudCA9IG9sZEdsb2JhbE1vbWVudDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBtYWtlR2xvYmFsKHRydWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBtYWtlR2xvYmFsKCk7XHJcbiAgICB9XHJcbn0pLmNhbGwodGhpcyk7XHJcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjJcclxuKGZ1bmN0aW9uKCkge1xyXG4gIHZhciBkZXByZWNhdGUsIGhhc01vZHVsZSwgbWFrZVR3aXgsXHJcbiAgICBfX3NsaWNlID0gW10uc2xpY2U7XHJcblxyXG4gIGhhc01vZHVsZSA9ICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZSAhPT0gbnVsbCkgJiYgKG1vZHVsZS5leHBvcnRzICE9IG51bGwpO1xyXG5cclxuICBkZXByZWNhdGUgPSBmdW5jdGlvbihuYW1lLCBpbnN0ZWFkLCBmbikge1xyXG4gICAgdmFyIGFscmVhZHlEb25lO1xyXG5cclxuICAgIGFscmVhZHlEb25lID0gZmFsc2U7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBhcmdzO1xyXG5cclxuICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XHJcbiAgICAgIGlmICghYWxyZWFkeURvbmUpIHtcclxuICAgICAgICBpZiAoKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwpICYmIChjb25zb2xlLndhcm4gIT0gbnVsbCkpIHtcclxuICAgICAgICAgIGNvbnNvbGUud2FybihcIiNcIiArIG5hbWUgKyBcIiBpcyBkZXByZWNhdGVkLiBVc2UgI1wiICsgaW5zdGVhZCArIFwiIGluc3RlYWQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBhbHJlYWR5RG9uZSA9IHRydWU7XHJcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgbWFrZVR3aXggPSBmdW5jdGlvbihtb21lbnQpIHtcclxuICAgIHZhciBUd2l4LCBnZXRQcm90b3R5cGVPZiwgbGFuZ3VhZ2VzTG9hZGVkO1xyXG5cclxuICAgIGlmIChtb21lbnQgPT0gbnVsbCkge1xyXG4gICAgICB0aHJvdyBcIkNhbid0IGZpbmQgbW9tZW50XCI7XHJcbiAgICB9XHJcbiAgICBsYW5ndWFnZXNMb2FkZWQgPSBmYWxzZTtcclxuICAgIFR3aXggPSAoZnVuY3Rpb24oKSB7XHJcbiAgICAgIGZ1bmN0aW9uIFR3aXgoc3RhcnQsIGVuZCwgcGFyc2VGb3JtYXQsIG9wdGlvbnMpIHtcclxuICAgICAgICB2YXIgX3JlZjtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xyXG4gICAgICAgICAgb3B0aW9ucyA9IHt9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIHBhcnNlRm9ybWF0ICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICBvcHRpb25zID0gcGFyc2VGb3JtYXQgIT0gbnVsbCA/IHBhcnNlRm9ybWF0IDoge307XHJcbiAgICAgICAgICBwYXJzZUZvcm1hdCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgICAgIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGFsbERheTogb3B0aW9uc1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zdGFydCA9IG1vbWVudChzdGFydCwgcGFyc2VGb3JtYXQsIG9wdGlvbnMucGFyc2VTdHJpY3QpO1xyXG4gICAgICAgIHRoaXMuZW5kID0gbW9tZW50KGVuZCwgcGFyc2VGb3JtYXQsIG9wdGlvbnMucGFyc2VTdHJpY3QpO1xyXG4gICAgICAgIHRoaXMuYWxsRGF5ID0gKF9yZWYgPSBvcHRpb25zLmFsbERheSkgIT0gbnVsbCA/IF9yZWYgOiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgVHdpeC5fZXh0ZW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGF0dHIsIGZpcnN0LCBvdGhlciwgb3RoZXJzLCBfaSwgX2xlbjtcclxuXHJcbiAgICAgICAgZmlyc3QgPSBhcmd1bWVudHNbMF0sIG90aGVycyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XHJcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBvdGhlcnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcclxuICAgICAgICAgIG90aGVyID0gb3RoZXJzW19pXTtcclxuICAgICAgICAgIGZvciAoYXR0ciBpbiBvdGhlcikge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG90aGVyW2F0dHJdICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgZmlyc3RbYXR0cl0gPSBvdGhlclthdHRyXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmlyc3Q7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LmRlZmF1bHRzID0ge1xyXG4gICAgICAgIHR3ZW50eUZvdXJIb3VyOiBmYWxzZSxcclxuICAgICAgICBhbGxEYXlTaW1wbGU6IHtcclxuICAgICAgICAgIGZuOiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5hbGxEYXk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2xvdDogMCxcclxuICAgICAgICAgIHByZTogXCIgXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRheU9mV2Vlazoge1xyXG4gICAgICAgICAgZm46IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGF0ZS5mb3JtYXQob3B0aW9ucy53ZWVrZGF5Rm9ybWF0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbG90OiAxLFxyXG4gICAgICAgICAgcHJlOiBcIiBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYWxsRGF5TW9udGg6IHtcclxuICAgICAgICAgIGZuOiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRhdGUuZm9ybWF0KFwiXCIgKyBvcHRpb25zLm1vbnRoRm9ybWF0ICsgXCIgXCIgKyBvcHRpb25zLmRheUZvcm1hdCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2xvdDogMixcclxuICAgICAgICAgIHByZTogXCIgXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIG1vbnRoOiB7XHJcbiAgICAgICAgICBmbjogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkYXRlLmZvcm1hdChvcHRpb25zLm1vbnRoRm9ybWF0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbG90OiAyLFxyXG4gICAgICAgICAgcHJlOiBcIiBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGF0ZToge1xyXG4gICAgICAgICAgZm46IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGF0ZS5mb3JtYXQob3B0aW9ucy5kYXlGb3JtYXQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNsb3Q6IDMsXHJcbiAgICAgICAgICBwcmU6IFwiIFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB5ZWFyOiB7XHJcbiAgICAgICAgICBmbjogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkYXRlLmZvcm1hdChvcHRpb25zLnllYXJGb3JtYXQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNsb3Q6IDQsXHJcbiAgICAgICAgICBwcmU6IFwiLCBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGltZToge1xyXG4gICAgICAgICAgZm46IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICAgICAgICB2YXIgc3RyO1xyXG5cclxuICAgICAgICAgICAgICBzdHIgPSBkYXRlLm1pbnV0ZXMoKSA9PT0gMCAmJiBvcHRpb25zLmltcGxpY2l0TWludXRlcyAmJiAhb3B0aW9ucy50d2VudHlGb3VySG91ciA/IGRhdGUuZm9ybWF0KG9wdGlvbnMuaG91ckZvcm1hdCkgOiBkYXRlLmZvcm1hdChcIlwiICsgb3B0aW9ucy5ob3VyRm9ybWF0ICsgXCI6XCIgKyBvcHRpb25zLm1pbnV0ZUZvcm1hdCk7XHJcbiAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmdyb3VwTWVyaWRpZW1zICYmICFvcHRpb25zLnR3ZW50eUZvdXJIb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zcGFjZUJlZm9yZU1lcmlkaWVtKSB7XHJcbiAgICAgICAgICAgICAgICAgIHN0ciArPSBcIiBcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN0ciArPSBkYXRlLmZvcm1hdChvcHRpb25zLm1lcmlkaWVtRm9ybWF0KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbG90OiA1LFxyXG4gICAgICAgICAgcHJlOiBcIiwgXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIG1lcmlkaWVtOiB7XHJcbiAgICAgICAgICBmbjogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gdC5mb3JtYXQob3B0aW9ucy5tZXJpZGllbUZvcm1hdCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2xvdDogNixcclxuICAgICAgICAgIHByZTogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zcGFjZUJlZm9yZU1lcmlkaWVtKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFwiIFwiO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5yZWdpc3RlckxhbmcgPSBmdW5jdGlvbihuYW1lLCBvcHRpb25zKSB7XHJcbiAgICAgICAgcmV0dXJuIG1vbWVudC5sYW5nKG5hbWUsIHtcclxuICAgICAgICAgIHR3aXg6IFR3aXguX2V4dGVuZCh7fSwgVHdpeC5kZWZhdWx0cywgb3B0aW9ucylcclxuICAgICAgICB9KTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmlzU2FtZSA9IGZ1bmN0aW9uKHBlcmlvZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0YXJ0LmlzU2FtZSh0aGlzLmVuZCwgcGVyaW9kKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uKHBlcmlvZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90cnVlRW5kKHRydWUpLmRpZmYodGhpcy5fdHJ1ZVN0YXJ0KCksIHBlcmlvZCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uKHBlcmlvZCkge1xyXG4gICAgICAgIHZhciBlbmQsIHN0YXJ0O1xyXG5cclxuICAgICAgICBzdGFydCA9IHRoaXMuc3RhcnQuY2xvbmUoKS5zdGFydE9mKHBlcmlvZCk7XHJcbiAgICAgICAgZW5kID0gdGhpcy5lbmQuY2xvbmUoKS5zdGFydE9mKHBlcmlvZCk7XHJcbiAgICAgICAgcmV0dXJuIGVuZC5kaWZmKHN0YXJ0LCBwZXJpb2QpICsgMTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmNvdW50SW5uZXIgPSBmdW5jdGlvbihwZXJpb2QpIHtcclxuICAgICAgICB2YXIgZW5kLCBzdGFydCwgX3JlZjtcclxuXHJcbiAgICAgICAgX3JlZiA9IHRoaXMuX2lubmVyKHBlcmlvZCksIHN0YXJ0ID0gX3JlZlswXSwgZW5kID0gX3JlZlsxXTtcclxuICAgICAgICBpZiAoc3RhcnQgPj0gZW5kKSB7XHJcbiAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVuZC5kaWZmKHN0YXJ0LCBwZXJpb2QpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuaXRlcmF0ZSA9IGZ1bmN0aW9uKGludGVydmFsQW1vdW50LCBwZXJpb2QsIG1pbkhvdXJzKSB7XHJcbiAgICAgICAgdmFyIGVuZCwgaGFzTmV4dCwgc3RhcnQsIF9yZWYsXHJcbiAgICAgICAgICBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChpbnRlcnZhbEFtb3VudCA9PSBudWxsKSB7XHJcbiAgICAgICAgICBpbnRlcnZhbEFtb3VudCA9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF9yZWYgPSB0aGlzLl9wcmVwSXRlcmF0ZUlucHV0cyhpbnRlcnZhbEFtb3VudCwgcGVyaW9kLCBtaW5Ib3VycyksIGludGVydmFsQW1vdW50ID0gX3JlZlswXSwgcGVyaW9kID0gX3JlZlsxXSwgbWluSG91cnMgPSBfcmVmWzJdO1xyXG4gICAgICAgIHN0YXJ0ID0gdGhpcy5zdGFydC5jbG9uZSgpLnN0YXJ0T2YocGVyaW9kKTtcclxuICAgICAgICBlbmQgPSB0aGlzLmVuZC5jbG9uZSgpLnN0YXJ0T2YocGVyaW9kKTtcclxuICAgICAgICBoYXNOZXh0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gc3RhcnQgPD0gZW5kICYmICghbWluSG91cnMgfHwgc3RhcnQudmFsdWVPZigpICE9PSBlbmQudmFsdWVPZigpIHx8IF90aGlzLmVuZC5ob3VycygpID4gbWluSG91cnMgfHwgX3RoaXMuYWxsRGF5KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pdGVyYXRlSGVscGVyKHBlcmlvZCwgc3RhcnQsIGhhc05leHQsIGludGVydmFsQW1vdW50KTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLml0ZXJhdGVJbm5lciA9IGZ1bmN0aW9uKGludGVydmFsQW1vdW50LCBwZXJpb2QpIHtcclxuICAgICAgICB2YXIgZW5kLCBoYXNOZXh0LCBzdGFydCwgX3JlZiwgX3JlZjE7XHJcblxyXG4gICAgICAgIGlmIChpbnRlcnZhbEFtb3VudCA9PSBudWxsKSB7XHJcbiAgICAgICAgICBpbnRlcnZhbEFtb3VudCA9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF9yZWYgPSB0aGlzLl9wcmVwSXRlcmF0ZUlucHV0cyhpbnRlcnZhbEFtb3VudCwgcGVyaW9kKSwgaW50ZXJ2YWxBbW91bnQgPSBfcmVmWzBdLCBwZXJpb2QgPSBfcmVmWzFdO1xyXG4gICAgICAgIF9yZWYxID0gdGhpcy5faW5uZXIocGVyaW9kLCBpbnRlcnZhbEFtb3VudCksIHN0YXJ0ID0gX3JlZjFbMF0sIGVuZCA9IF9yZWYxWzFdO1xyXG4gICAgICAgIGhhc05leHQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiBzdGFydCA8IGVuZDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pdGVyYXRlSGVscGVyKHBlcmlvZCwgc3RhcnQsIGhhc05leHQsIGludGVydmFsQW1vdW50KTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmh1bWFuaXplTGVuZ3RoID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRGF5KSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5pc1NhbWUoXCJkYXlcIikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiYWxsIGRheVwiO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnQuZnJvbSh0aGlzLmVuZC5jbG9uZSgpLmFkZCgxLCBcImRheVwiKSwgdHJ1ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0LmZyb20odGhpcy5lbmQsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmFzRHVyYXRpb24gPSBmdW5jdGlvbih1bml0cykge1xyXG4gICAgICAgIHZhciBkaWZmO1xyXG5cclxuICAgICAgICBkaWZmID0gdGhpcy5lbmQuZGlmZih0aGlzLnN0YXJ0KTtcclxuICAgICAgICByZXR1cm4gbW9tZW50LmR1cmF0aW9uKGRpZmYpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuaXNQYXN0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRGF5KSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5lbmQuY2xvbmUoKS5lbmRPZihcImRheVwiKSA8IG1vbWVudCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5lbmQgPCBtb21lbnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5pc0Z1dHVyZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmFsbERheSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnQuY2xvbmUoKS5zdGFydE9mKFwiZGF5XCIpID4gbW9tZW50KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0ID4gbW9tZW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuaXNDdXJyZW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICF0aGlzLmlzUGFzdCgpICYmICF0aGlzLmlzRnV0dXJlKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKG1vbSkge1xyXG4gICAgICAgIG1vbSA9IG1vbWVudChtb20pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90cnVlU3RhcnQoKSA8PSBtb20gJiYgdGhpcy5fdHJ1ZUVuZCgpID49IG1vbTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdHJ1ZVN0YXJ0KCkudmFsdWVPZigpID09PSB0aGlzLl90cnVlRW5kKCkudmFsdWVPZigpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUub3ZlcmxhcHMgPSBmdW5jdGlvbihvdGhlcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90cnVlRW5kKCkuaXNBZnRlcihvdGhlci5fdHJ1ZVN0YXJ0KCkpICYmIHRoaXMuX3RydWVTdGFydCgpLmlzQmVmb3JlKG90aGVyLl90cnVlRW5kKCkpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuZW5ndWxmcyA9IGZ1bmN0aW9uKG90aGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RydWVTdGFydCgpIDw9IG90aGVyLl90cnVlU3RhcnQoKSAmJiB0aGlzLl90cnVlRW5kKCkgPj0gb3RoZXIuX3RydWVFbmQoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLnVuaW9uID0gZnVuY3Rpb24ob3RoZXIpIHtcclxuICAgICAgICB2YXIgYWxsRGF5LCBuZXdFbmQsIG5ld1N0YXJ0O1xyXG5cclxuICAgICAgICBhbGxEYXkgPSB0aGlzLmFsbERheSAmJiBvdGhlci5hbGxEYXk7XHJcbiAgICAgICAgaWYgKGFsbERheSkge1xyXG4gICAgICAgICAgbmV3U3RhcnQgPSB0aGlzLnN0YXJ0IDwgb3RoZXIuc3RhcnQgPyB0aGlzLnN0YXJ0IDogb3RoZXIuc3RhcnQ7XHJcbiAgICAgICAgICBuZXdFbmQgPSB0aGlzLmVuZCA+IG90aGVyLmVuZCA/IHRoaXMuZW5kIDogb3RoZXIuZW5kO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBuZXdTdGFydCA9IHRoaXMuX3RydWVTdGFydCgpIDwgb3RoZXIuX3RydWVTdGFydCgpID8gdGhpcy5fdHJ1ZVN0YXJ0KCkgOiBvdGhlci5fdHJ1ZVN0YXJ0KCk7XHJcbiAgICAgICAgICBuZXdFbmQgPSB0aGlzLl90cnVlRW5kKCkgPiBvdGhlci5fdHJ1ZUVuZCgpID8gdGhpcy5fdHJ1ZUVuZCgpIDogb3RoZXIuX3RydWVFbmQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBUd2l4KG5ld1N0YXJ0LCBuZXdFbmQsIGFsbERheSk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbihvdGhlcikge1xyXG4gICAgICAgIHZhciBhbGxEYXksIGVuZCwgbmV3RW5kLCBuZXdTdGFydDtcclxuXHJcbiAgICAgICAgbmV3U3RhcnQgPSB0aGlzLnN0YXJ0ID4gb3RoZXIuc3RhcnQgPyB0aGlzLnN0YXJ0IDogb3RoZXIuc3RhcnQ7XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRGF5KSB7XHJcbiAgICAgICAgICBlbmQgPSBtb21lbnQodGhpcy5lbmQpO1xyXG4gICAgICAgICAgZW5kLmFkZCgxLCBcImRheVwiKTtcclxuICAgICAgICAgIGVuZC5zdWJ0cmFjdCgxLCBcIm1pbGxpc2Vjb25kXCIpO1xyXG4gICAgICAgICAgaWYgKG90aGVyLmFsbERheSkge1xyXG4gICAgICAgICAgICBuZXdFbmQgPSBlbmQgPCBvdGhlci5lbmQgPyB0aGlzLmVuZCA6IG90aGVyLmVuZDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG5ld0VuZCA9IGVuZCA8IG90aGVyLmVuZCA/IGVuZCA6IG90aGVyLmVuZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbmV3RW5kID0gdGhpcy5lbmQgPCBvdGhlci5lbmQgPyB0aGlzLmVuZCA6IG90aGVyLmVuZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgYWxsRGF5ID0gdGhpcy5hbGxEYXkgJiYgb3RoZXIuYWxsRGF5O1xyXG4gICAgICAgIHJldHVybiBuZXcgVHdpeChuZXdTdGFydCwgbmV3RW5kLCBhbGxEYXkpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuaXNWYWxpZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90cnVlU3RhcnQoKSA8PSB0aGlzLl90cnVlRW5kKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbihvdGhlcikge1xyXG4gICAgICAgIHJldHVybiAob3RoZXIgaW5zdGFuY2VvZiBUd2l4KSAmJiB0aGlzLmFsbERheSA9PT0gb3RoZXIuYWxsRGF5ICYmIHRoaXMuc3RhcnQudmFsdWVPZigpID09PSBvdGhlci5zdGFydC52YWx1ZU9mKCkgJiYgdGhpcy5lbmQudmFsdWVPZigpID09PSBvdGhlci5lbmQudmFsdWVPZigpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgX3JlZjtcclxuXHJcbiAgICAgICAgcmV0dXJuIFwie3N0YXJ0OiBcIiArICh0aGlzLnN0YXJ0LmZvcm1hdCgpKSArIFwiLCBlbmQ6IFwiICsgKHRoaXMuZW5kLmZvcm1hdCgpKSArIFwiLCBhbGxEYXk6IFwiICsgKChfcmVmID0gdGhpcy5hbGxEYXkpICE9IG51bGwgPyBfcmVmIDoge1xyXG4gICAgICAgICAgXCJ0cnVlXCI6IFwiZmFsc2VcIlxyXG4gICAgICAgIH0pICsgXCJ9XCI7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5zaW1wbGVGb3JtYXQgPSBmdW5jdGlvbihtb21lbnRPcHRzLCBpbm9wdHMpIHtcclxuICAgICAgICB2YXIgb3B0aW9ucywgcztcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IHtcclxuICAgICAgICAgIGFsbERheTogXCIoYWxsIGRheSlcIixcclxuICAgICAgICAgIHRlbXBsYXRlOiBUd2l4LmZvcm1hdFRlbXBsYXRlXHJcbiAgICAgICAgfTtcclxuICAgICAgICBUd2l4Ll9leHRlbmQob3B0aW9ucywgaW5vcHRzIHx8IHt9KTtcclxuICAgICAgICBzID0gb3B0aW9ucy50ZW1wbGF0ZSh0aGlzLnN0YXJ0LmZvcm1hdChtb21lbnRPcHRzKSwgdGhpcy5lbmQuZm9ybWF0KG1vbWVudE9wdHMpKTtcclxuICAgICAgICBpZiAodGhpcy5hbGxEYXkgJiYgb3B0aW9ucy5hbGxEYXkpIHtcclxuICAgICAgICAgIHMgKz0gXCIgXCIgKyBvcHRpb25zLmFsbERheTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbihpbm9wdHMpIHtcclxuICAgICAgICB2YXIgY29tbW9uX2J1Y2tldCwgZW5kX2J1Y2tldCwgZm9sZCwgZm9ybWF0LCBmcywgZ2xvYmFsX2ZpcnN0LCBnb2VzSW50b1RoZU1vcm5pbmcsIG5lZWREYXRlLCBvcHRpb25zLCBwcm9jZXNzLCBzdGFydF9idWNrZXQsIHRvZ2V0aGVyLCBfaSwgX2xlbixcclxuICAgICAgICAgIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5fbGF6eUxhbmcoKTtcclxuICAgICAgICBpZiAodGhpcy5pc0VtcHR5KCkpIHtcclxuICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvcHRpb25zID0ge1xyXG4gICAgICAgICAgZ3JvdXBNZXJpZGllbXM6IHRydWUsXHJcbiAgICAgICAgICBzcGFjZUJlZm9yZU1lcmlkaWVtOiB0cnVlLFxyXG4gICAgICAgICAgc2hvd0RhdGU6IHRydWUsXHJcbiAgICAgICAgICBzaG93RGF5T2ZXZWVrOiBmYWxzZSxcclxuICAgICAgICAgIHR3ZW50eUZvdXJIb3VyOiB0aGlzLmxhbmdEYXRhLnR3ZW50eUZvdXJIb3VyLFxyXG4gICAgICAgICAgaW1wbGljaXRNaW51dGVzOiB0cnVlLFxyXG4gICAgICAgICAgaW1wbGljaXRZZWFyOiB0cnVlLFxyXG4gICAgICAgICAgeWVhckZvcm1hdDogXCJZWVlZXCIsXHJcbiAgICAgICAgICBtb250aEZvcm1hdDogXCJNTU1cIixcclxuICAgICAgICAgIHdlZWtkYXlGb3JtYXQ6IFwiZGRkXCIsXHJcbiAgICAgICAgICBkYXlGb3JtYXQ6IFwiRFwiLFxyXG4gICAgICAgICAgbWVyaWRpZW1Gb3JtYXQ6IFwiQVwiLFxyXG4gICAgICAgICAgaG91ckZvcm1hdDogXCJoXCIsXHJcbiAgICAgICAgICBtaW51dGVGb3JtYXQ6IFwibW1cIixcclxuICAgICAgICAgIGFsbERheTogXCJhbGwgZGF5XCIsXHJcbiAgICAgICAgICBleHBsaWNpdEFsbERheTogZmFsc2UsXHJcbiAgICAgICAgICBsYXN0TmlnaHRFbmRzQXQ6IDAsXHJcbiAgICAgICAgICB0ZW1wbGF0ZTogVHdpeC5mb3JtYXRUZW1wbGF0ZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgVHdpeC5fZXh0ZW5kKG9wdGlvbnMsIGlub3B0cyB8fCB7fSk7XHJcbiAgICAgICAgZnMgPSBbXTtcclxuICAgICAgICBpZiAob3B0aW9ucy50d2VudHlGb3VySG91cikge1xyXG4gICAgICAgICAgb3B0aW9ucy5ob3VyRm9ybWF0ID0gb3B0aW9ucy5ob3VyRm9ybWF0LnJlcGxhY2UoXCJoXCIsIFwiSFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZ29lc0ludG9UaGVNb3JuaW5nID0gb3B0aW9ucy5sYXN0TmlnaHRFbmRzQXQgPiAwICYmICF0aGlzLmFsbERheSAmJiB0aGlzLmVuZC5jbG9uZSgpLnN0YXJ0T2YoXCJkYXlcIikudmFsdWVPZigpID09PSB0aGlzLnN0YXJ0LmNsb25lKCkuYWRkKDEsIFwiZGF5XCIpLnN0YXJ0T2YoXCJkYXlcIikudmFsdWVPZigpICYmIHRoaXMuc3RhcnQuaG91cnMoKSA+IDEyICYmIHRoaXMuZW5kLmhvdXJzKCkgPCBvcHRpb25zLmxhc3ROaWdodEVuZHNBdDtcclxuICAgICAgICBuZWVkRGF0ZSA9IG9wdGlvbnMuc2hvd0RhdGUgfHwgKCF0aGlzLmlzU2FtZShcImRheVwiKSAmJiAhZ29lc0ludG9UaGVNb3JuaW5nKTtcclxuICAgICAgICBpZiAodGhpcy5hbGxEYXkgJiYgdGhpcy5pc1NhbWUoXCJkYXlcIikgJiYgKCFvcHRpb25zLnNob3dEYXRlIHx8IG9wdGlvbnMuZXhwbGljaXRBbGxEYXkpKSB7XHJcbiAgICAgICAgICBmcy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogXCJhbGwgZGF5IHNpbXBsZVwiLFxyXG4gICAgICAgICAgICBmbjogdGhpcy5fZm9ybWF0Rm4oJ2FsbERheVNpbXBsZScsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBwcmU6IHRoaXMuX2Zvcm1hdFByZSgnYWxsRGF5U2ltcGxlJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHNsb3Q6IHRoaXMuX2Zvcm1hdFNsb3QoJ2FsbERheVNpbXBsZScpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG5lZWREYXRlICYmICghb3B0aW9ucy5pbXBsaWNpdFllYXIgfHwgdGhpcy5zdGFydC55ZWFyKCkgIT09IG1vbWVudCgpLnllYXIoKSB8fCAhdGhpcy5pc1NhbWUoXCJ5ZWFyXCIpKSkge1xyXG4gICAgICAgICAgZnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IFwieWVhclwiLFxyXG4gICAgICAgICAgICBmbjogdGhpcy5fZm9ybWF0Rm4oJ3llYXInLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgcHJlOiB0aGlzLl9mb3JtYXRQcmUoJ3llYXInLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgc2xvdDogdGhpcy5fZm9ybWF0U2xvdCgneWVhcicpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmFsbERheSAmJiBuZWVkRGF0ZSkge1xyXG4gICAgICAgICAgZnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiYWxsIGRheSBtb250aFwiLFxyXG4gICAgICAgICAgICBmbjogdGhpcy5fZm9ybWF0Rm4oJ2FsbERheU1vbnRoJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIGlnbm9yZUVuZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGdvZXNJbnRvVGhlTW9ybmluZztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJlOiB0aGlzLl9mb3JtYXRQcmUoJ2FsbERheU1vbnRoJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHNsb3Q6IHRoaXMuX2Zvcm1hdFNsb3QoJ2FsbERheU1vbnRoJylcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5hbGxEYXkgJiYgbmVlZERhdGUpIHtcclxuICAgICAgICAgIGZzLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBcIm1vbnRoXCIsXHJcbiAgICAgICAgICAgIGZuOiB0aGlzLl9mb3JtYXRGbignbW9udGgnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgcHJlOiB0aGlzLl9mb3JtYXRQcmUoJ21vbnRoJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHNsb3Q6IHRoaXMuX2Zvcm1hdFNsb3QoJ21vbnRoJylcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5hbGxEYXkgJiYgbmVlZERhdGUpIHtcclxuICAgICAgICAgIGZzLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBcImRhdGVcIixcclxuICAgICAgICAgICAgZm46IHRoaXMuX2Zvcm1hdEZuKCdkYXRlJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHByZTogdGhpcy5fZm9ybWF0UHJlKCdkYXRlJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHNsb3Q6IHRoaXMuX2Zvcm1hdFNsb3QoJ2RhdGUnKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuZWVkRGF0ZSAmJiBvcHRpb25zLnNob3dEYXlPZldlZWspIHtcclxuICAgICAgICAgIGZzLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBcImRheSBvZiB3ZWVrXCIsXHJcbiAgICAgICAgICAgIGZuOiB0aGlzLl9mb3JtYXRGbignZGF5T2ZXZWVrJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHByZTogdGhpcy5fZm9ybWF0UHJlKCdkYXlPZldlZWsnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgc2xvdDogdGhpcy5fZm9ybWF0U2xvdCgnZGF5T2ZXZWVrJylcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5ncm91cE1lcmlkaWVtcyAmJiAhb3B0aW9ucy50d2VudHlGb3VySG91ciAmJiAhdGhpcy5hbGxEYXkpIHtcclxuICAgICAgICAgIGZzLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBcIm1lcmlkaWVtXCIsXHJcbiAgICAgICAgICAgIGZuOiB0aGlzLl9mb3JtYXRGbignbWVyaWRpZW0nLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgcHJlOiB0aGlzLl9mb3JtYXRQcmUoJ21lcmlkaWVtJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHNsb3Q6IHRoaXMuX2Zvcm1hdFNsb3QoJ21lcmlkaWVtJylcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRoaXMuYWxsRGF5KSB7XHJcbiAgICAgICAgICBmcy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogXCJ0aW1lXCIsXHJcbiAgICAgICAgICAgIGZuOiB0aGlzLl9mb3JtYXRGbigndGltZScsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBwcmU6IHRoaXMuX2Zvcm1hdFByZSgndGltZScsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBzbG90OiB0aGlzLl9mb3JtYXRTbG90KCd0aW1lJylcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGFydF9idWNrZXQgPSBbXTtcclxuICAgICAgICBlbmRfYnVja2V0ID0gW107XHJcbiAgICAgICAgY29tbW9uX2J1Y2tldCA9IFtdO1xyXG4gICAgICAgIHRvZ2V0aGVyID0gdHJ1ZTtcclxuICAgICAgICBwcm9jZXNzID0gZnVuY3Rpb24oZm9ybWF0KSB7XHJcbiAgICAgICAgICB2YXIgZW5kX3N0ciwgc3RhcnRfZ3JvdXAsIHN0YXJ0X3N0cjtcclxuXHJcbiAgICAgICAgICBzdGFydF9zdHIgPSBmb3JtYXQuZm4oX3RoaXMuc3RhcnQpO1xyXG4gICAgICAgICAgZW5kX3N0ciA9IGZvcm1hdC5pZ25vcmVFbmQgJiYgZm9ybWF0Lmlnbm9yZUVuZCgpID8gc3RhcnRfc3RyIDogZm9ybWF0LmZuKF90aGlzLmVuZCk7XHJcbiAgICAgICAgICBzdGFydF9ncm91cCA9IHtcclxuICAgICAgICAgICAgZm9ybWF0OiBmb3JtYXQsXHJcbiAgICAgICAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gc3RhcnRfc3RyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgaWYgKGVuZF9zdHIgPT09IHN0YXJ0X3N0ciAmJiB0b2dldGhlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gY29tbW9uX2J1Y2tldC5wdXNoKHN0YXJ0X2dyb3VwKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICh0b2dldGhlcikge1xyXG4gICAgICAgICAgICAgIHRvZ2V0aGVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgY29tbW9uX2J1Y2tldC5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdDoge1xyXG4gICAgICAgICAgICAgICAgICBzbG90OiBmb3JtYXQuc2xvdCxcclxuICAgICAgICAgICAgICAgICAgcHJlOiBcIlwiXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy50ZW1wbGF0ZShmb2xkKHN0YXJ0X2J1Y2tldCksIGZvbGQoZW5kX2J1Y2tldCwgdHJ1ZSkudHJpbSgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdGFydF9idWNrZXQucHVzaChzdGFydF9ncm91cCk7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmRfYnVja2V0LnB1c2goe1xyXG4gICAgICAgICAgICAgIGZvcm1hdDogZm9ybWF0LFxyXG4gICAgICAgICAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbmRfc3RyO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGZzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XHJcbiAgICAgICAgICBmb3JtYXQgPSBmc1tfaV07XHJcbiAgICAgICAgICBwcm9jZXNzKGZvcm1hdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdsb2JhbF9maXJzdCA9IHRydWU7XHJcbiAgICAgICAgZm9sZCA9IGZ1bmN0aW9uKGFycmF5LCBza2lwX3ByZSkge1xyXG4gICAgICAgICAgdmFyIGxvY2FsX2ZpcnN0LCBzZWN0aW9uLCBzdHIsIF9qLCBfbGVuMSwgX3JlZjtcclxuXHJcbiAgICAgICAgICBsb2NhbF9maXJzdCA9IHRydWU7XHJcbiAgICAgICAgICBzdHIgPSBcIlwiO1xyXG4gICAgICAgICAgX3JlZiA9IGFycmF5LnNvcnQoZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgICAgICByZXR1cm4gYS5mb3JtYXQuc2xvdCAtIGIuZm9ybWF0LnNsb3Q7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XHJcbiAgICAgICAgICAgIHNlY3Rpb24gPSBfcmVmW19qXTtcclxuICAgICAgICAgICAgaWYgKCFnbG9iYWxfZmlyc3QpIHtcclxuICAgICAgICAgICAgICBpZiAobG9jYWxfZmlyc3QgJiYgc2tpcF9wcmUpIHtcclxuICAgICAgICAgICAgICAgIHN0ciArPSBcIiBcIjtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc3RyICs9IHNlY3Rpb24uZm9ybWF0LnByZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RyICs9IHNlY3Rpb24udmFsdWUoKTtcclxuICAgICAgICAgICAgZ2xvYmFsX2ZpcnN0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGxvY2FsX2ZpcnN0ID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIGZvbGQoY29tbW9uX2J1Y2tldCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5fdHJ1ZVN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRGF5KSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5zdGFydC5jbG9uZSgpLnN0YXJ0T2YoXCJkYXlcIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0LmNsb25lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuX3RydWVFbmQgPSBmdW5jdGlvbihkaWZmYWJsZUVuZCkge1xyXG4gICAgICAgIGlmIChkaWZmYWJsZUVuZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICBkaWZmYWJsZUVuZCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5hbGxEYXkpIHtcclxuICAgICAgICAgIGlmIChkaWZmYWJsZUVuZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbmQuY2xvbmUoKS5hZGQoMSwgXCJkYXlcIik7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbmQuY2xvbmUoKS5lbmRPZihcImRheVwiKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZW5kLmNsb25lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuX2l0ZXJhdGVIZWxwZXIgPSBmdW5jdGlvbihwZXJpb2QsIGl0ZXIsIGhhc05leHQsIGludGVydmFsQW1vdW50KSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGludGVydmFsQW1vdW50ID09IG51bGwpIHtcclxuICAgICAgICAgIGludGVydmFsQW1vdW50ID0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgdmFsO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFoYXNOZXh0KCkpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB2YWwgPSBpdGVyLmNsb25lKCk7XHJcbiAgICAgICAgICAgICAgaXRlci5hZGQoaW50ZXJ2YWxBbW91bnQsIHBlcmlvZCk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHZhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGhhc05leHQ6IGhhc05leHRcclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuX3ByZXBJdGVyYXRlSW5wdXRzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGlucHV0cywgaW50ZXJ2YWxBbW91bnQsIG1pbkhvdXJzLCBwZXJpb2QsIF9yZWYsIF9yZWYxO1xyXG5cclxuICAgICAgICBpbnB1dHMgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xyXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXRzWzBdID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgcmV0dXJuIGlucHV0cztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dHNbMF0gPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICBwZXJpb2QgPSBpbnB1dHMuc2hpZnQoKTtcclxuICAgICAgICAgIGludGVydmFsQW1vdW50ID0gKF9yZWYgPSBpbnB1dHMucG9wKCkpICE9IG51bGwgPyBfcmVmIDogMTtcclxuICAgICAgICAgIGlmIChpbnB1dHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIG1pbkhvdXJzID0gKF9yZWYxID0gaW5wdXRzWzBdKSAhPSBudWxsID8gX3JlZjEgOiBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1vbWVudC5pc0R1cmF0aW9uKGlucHV0c1swXSkpIHtcclxuICAgICAgICAgIHBlcmlvZCA9ICdtaWxsaXNlY29uZHMnO1xyXG4gICAgICAgICAgaW50ZXJ2YWxBbW91bnQgPSBpbnB1dHNbMF0uYXMocGVyaW9kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFtpbnRlcnZhbEFtb3VudCwgcGVyaW9kLCBtaW5Ib3Vyc107XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5faW5uZXIgPSBmdW5jdGlvbihwZXJpb2QsIGludGVydmFsQW1vdW50KSB7XHJcbiAgICAgICAgdmFyIGR1cmF0aW9uQ291bnQsIGR1cmF0aW9uUGVyaW9kLCBlbmQsIG1vZHVsdXMsIHN0YXJ0O1xyXG5cclxuICAgICAgICBpZiAocGVyaW9kID09IG51bGwpIHtcclxuICAgICAgICAgIHBlcmlvZCA9IFwibWlsbGlzZWNvbmRzXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChpbnRlcnZhbEFtb3VudCA9PSBudWxsKSB7XHJcbiAgICAgICAgICBpbnRlcnZhbEFtb3VudCA9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0YXJ0ID0gdGhpcy5fdHJ1ZVN0YXJ0KCk7XHJcbiAgICAgICAgZW5kID0gdGhpcy5fdHJ1ZUVuZCh0cnVlKTtcclxuICAgICAgICBpZiAoc3RhcnQgPiBzdGFydC5jbG9uZSgpLnN0YXJ0T2YocGVyaW9kKSkge1xyXG4gICAgICAgICAgc3RhcnQuc3RhcnRPZihwZXJpb2QpLmFkZChpbnRlcnZhbEFtb3VudCwgcGVyaW9kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGVuZCA8IGVuZC5jbG9uZSgpLmVuZE9mKHBlcmlvZCkpIHtcclxuICAgICAgICAgIGVuZC5zdGFydE9mKHBlcmlvZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR1cmF0aW9uUGVyaW9kID0gc3RhcnQudHdpeChlbmQpLmFzRHVyYXRpb24ocGVyaW9kKTtcclxuICAgICAgICBkdXJhdGlvbkNvdW50ID0gZHVyYXRpb25QZXJpb2QuZ2V0KHBlcmlvZCk7XHJcbiAgICAgICAgbW9kdWx1cyA9IGR1cmF0aW9uQ291bnQgJSBpbnRlcnZhbEFtb3VudDtcclxuICAgICAgICBlbmQuc3VidHJhY3QobW9kdWx1cywgcGVyaW9kKTtcclxuICAgICAgICByZXR1cm4gW3N0YXJ0LCBlbmRdO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuX2xhenlMYW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGUsIGxhbmdEYXRhLCBsYW5ndWFnZXMsIF9yZWY7XHJcblxyXG4gICAgICAgIGxhbmdEYXRhID0gdGhpcy5zdGFydC5sYW5nKCk7XHJcbiAgICAgICAgaWYgKChsYW5nRGF0YSAhPSBudWxsKSAmJiB0aGlzLmVuZC5sYW5nKCkuX2FiYnIgIT09IGxhbmdEYXRhLl9hYmJyKSB7XHJcbiAgICAgICAgICB0aGlzLmVuZC5sYW5nKGxhbmdEYXRhLl9hYmJyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCh0aGlzLmxhbmdEYXRhICE9IG51bGwpICYmIHRoaXMubGFuZ0RhdGEuX2FiYnIgPT09IGxhbmdEYXRhLl9hYmJyKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChoYXNNb2R1bGUgJiYgIShsYW5ndWFnZXNMb2FkZWQgfHwgbGFuZ0RhdGEuX2FiYnIgPT09IFwiZW5cIikpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxhbmd1YWdlcyA9IHJlcXVpcmUoXCIuL2xhbmdcIik7XHJcbiAgICAgICAgICAgIGxhbmd1YWdlcyhtb21lbnQsIFR3aXgpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XHJcbiAgICAgICAgICAgIGUgPSBfZXJyb3I7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBsYW5ndWFnZXNMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5sYW5nRGF0YSA9IChfcmVmID0gbGFuZ0RhdGEgIT0gbnVsbCA/IGxhbmdEYXRhLl90d2l4IDogdm9pZCAwKSAhPSBudWxsID8gX3JlZiA6IFR3aXguZGVmYXVsdHM7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5fZm9ybWF0Rm4gPSBmdW5jdGlvbihuYW1lLCBvcHRpb25zKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFuZ0RhdGFbbmFtZV0uZm4ob3B0aW9ucyk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5fZm9ybWF0U2xvdCA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYW5nRGF0YVtuYW1lXS5zbG90O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuX2Zvcm1hdFByZSA9IGZ1bmN0aW9uKG5hbWUsIG9wdGlvbnMpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMubGFuZ0RhdGFbbmFtZV0ucHJlID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmxhbmdEYXRhW25hbWVdLnByZShvcHRpb25zKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMubGFuZ0RhdGFbbmFtZV0ucHJlO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLnNhbWVEYXkgPSBkZXByZWNhdGUoXCJzYW1lRGF5XCIsIFwiaXNTYW1lKCdkYXknKVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pc1NhbWUoXCJkYXlcIik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuc2FtZVllYXIgPSBkZXByZWNhdGUoXCJzYW1lWWVhclwiLCBcImlzU2FtZSgneWVhcicpXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmlzU2FtZShcInllYXJcIik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuY291bnREYXlzID0gZGVwcmVjYXRlKFwiY291bnREYXlzXCIsIFwiY291bnRPdXRlcignZGF5cycpXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvdW50T3V0ZXIoXCJkYXlzXCIpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmRheXNJbiA9IGRlcHJlY2F0ZShcImRheXNJblwiLCBcIml0ZXJhdGUoJ2RheXMnIFssbWluSG91cnNdKVwiLCBmdW5jdGlvbihtaW5Ib3Vycykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLml0ZXJhdGUoJ2RheXMnLCBtaW5Ib3Vycyk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUucGFzdCA9IGRlcHJlY2F0ZShcInBhc3RcIiwgXCJpc1Bhc3QoKVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pc1Bhc3QoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5kdXJhdGlvbiA9IGRlcHJlY2F0ZShcImR1cmF0aW9uXCIsIFwiaHVtYW5pemVMZW5ndGgoKVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5odW1hbml6ZUxlbmd0aCgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLm1lcmdlID0gZGVwcmVjYXRlKFwibWVyZ2VcIiwgXCJ1bmlvbihvdGhlcilcIiwgZnVuY3Rpb24ob3RoZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51bmlvbihvdGhlcik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIFR3aXg7XHJcblxyXG4gICAgfSkoKTtcclxuICAgIGdldFByb3RvdHlwZU9mID0gZnVuY3Rpb24obykge1xyXG4gICAgICBpZiAodHlwZW9mIE9iamVjdC5nZXRQcm90b3R5cGVPZiA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTtcclxuICAgICAgfSBlbHNlIGlmIChcIlwiLl9fcHJvdG9fXyA9PT0gU3RyaW5nLnByb3RvdHlwZSkge1xyXG4gICAgICAgIHJldHVybiBvLl9fcHJvdG9fXztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gby5jb25zdHJ1Y3Rvci5wcm90b3R5cGU7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBUd2l4Ll9leHRlbmQoZ2V0UHJvdG90eXBlT2YobW9tZW50LmZuLl9sYW5nKSwge1xyXG4gICAgICBfdHdpeDogVHdpeC5kZWZhdWx0c1xyXG4gICAgfSk7XHJcbiAgICBUd2l4LmZvcm1hdFRlbXBsYXRlID0gZnVuY3Rpb24obGVmdFNpZGUsIHJpZ2h0U2lkZSkge1xyXG4gICAgICByZXR1cm4gXCJcIiArIGxlZnRTaWRlICsgXCIgLSBcIiArIHJpZ2h0U2lkZTtcclxuICAgIH07XHJcbiAgICBtb21lbnQudHdpeCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gKGZ1bmN0aW9uKGZ1bmMsIGFyZ3MsIGN0b3IpIHtcclxuICAgICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xyXG4gICAgICAgIHZhciBjaGlsZCA9IG5ldyBjdG9yLCByZXN1bHQgPSBmdW5jLmFwcGx5KGNoaWxkLCBhcmdzKTtcclxuICAgICAgICByZXR1cm4gT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCA/IHJlc3VsdCA6IGNoaWxkO1xyXG4gICAgICB9KShUd2l4LCBhcmd1bWVudHMsIGZ1bmN0aW9uKCl7fSk7XHJcbiAgICB9O1xyXG4gICAgbW9tZW50LmZuLnR3aXggPSBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIChmdW5jdGlvbihmdW5jLCBhcmdzLCBjdG9yKSB7XHJcbiAgICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcclxuICAgICAgICB2YXIgY2hpbGQgPSBuZXcgY3RvciwgcmVzdWx0ID0gZnVuYy5hcHBseShjaGlsZCwgYXJncyk7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdChyZXN1bHQpID09PSByZXN1bHQgPyByZXN1bHQgOiBjaGlsZDtcclxuICAgICAgfSkoVHdpeCwgW3RoaXNdLmNvbmNhdChfX3NsaWNlLmNhbGwoYXJndW1lbnRzKSksIGZ1bmN0aW9uKCl7fSk7XHJcbiAgICB9O1xyXG4gICAgbW9tZW50LmZuLmZvckR1cmF0aW9uID0gZnVuY3Rpb24oZHVyYXRpb24sIGFsbERheSkge1xyXG4gICAgICByZXR1cm4gbmV3IFR3aXgodGhpcywgdGhpcy5jbG9uZSgpLmFkZChkdXJhdGlvbiksIGFsbERheSk7XHJcbiAgICB9O1xyXG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmFmdGVyTW9tZW50ID0gZnVuY3Rpb24oc3RhcnRpbmdUaW1lLCBhbGxEYXkpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUd2l4KHN0YXJ0aW5nVGltZSwgbW9tZW50KHN0YXJ0aW5nVGltZSkuY2xvbmUoKS5hZGQodGhpcyksIGFsbERheSk7XHJcbiAgICB9O1xyXG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmJlZm9yZU1vbWVudCA9IGZ1bmN0aW9uKHN0YXJ0aW5nVGltZSwgYWxsRGF5KSB7XHJcbiAgICAgIHJldHVybiBuZXcgVHdpeChtb21lbnQoc3RhcnRpbmdUaW1lKS5jbG9uZSgpLnN1YnRyYWN0KHRoaXMpLCBzdGFydGluZ1RpbWUsIGFsbERheSk7XHJcbiAgICB9O1xyXG4gICAgbW9tZW50LnR3aXhDbGFzcyA9IFR3aXg7XHJcbiAgICByZXR1cm4gVHdpeDtcclxuICB9O1xyXG5cclxuICBpZiAoaGFzTW9kdWxlKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1ha2VUd2l4KHJlcXVpcmUoXCJtb21lbnRcIikpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgZGVmaW5lKFwidHdpeFwiLCBbXCJtb21lbnRcIl0sIGZ1bmN0aW9uKG1vbWVudCkge1xyXG4gICAgICByZXR1cm4gbWFrZVR3aXgobW9tZW50KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRoaXMubW9tZW50ICE9IG51bGwpIHtcclxuICAgIHRoaXMuVHdpeCA9IG1ha2VUd2l4KHRoaXMubW9tZW50KTtcclxuICB9XHJcblxyXG59KS5jYWxsKHRoaXMpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcbiAgZ3JwaCA9IHt9O1xyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9heGlzX2NhdGVnb3JpY2FsKCkge1xyXG5cclxuICB2YXIgc2NhbGUgPSBncnBoX3NjYWxlX2NhdGVnb3JpY2FsKCk7XHJcbiAgdmFyIHdpZHRoO1xyXG4gIHZhciB2YXJpYWJsZSwgaGVpZ2h0O1xyXG5cclxuICB2YXIgZHVtbXlfID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzX2NhdGVnb3JpY2FsIGR1bW15XCIpXHJcbiAgICAuYXR0cihcIndpZHRoXCIsIDApLmF0dHIoXCJoZWlnaHRcIiwgMClcclxuICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgdmFyIGxhYmVsX3NpemVfID0gZ3JwaF9sYWJlbF9zaXplKGR1bW15Xyk7XHJcblxyXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xyXG4gICAgdmFyIHRpY2tzID0gYXhpcy50aWNrcygpO1xyXG4gICAgZy5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBheGlzLndpZHRoKCkpLmF0dHIoXCJoZWlnaHRcIiwgYXhpcy5oZWlnaHQoKSk7XHJcbiAgICBnLnNlbGVjdEFsbChcIi50aWNrXCIpLmRhdGEodGlja3MpLmVudGVyKClcclxuICAgICAgLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIFwidGlja3NcIilcclxuICAgICAgLmF0dHIoXCJ4MVwiLCBheGlzLndpZHRoKCkgLSBzZXR0aW5ncyhcInRpY2tfbGVuZ3RoXCIpKVxyXG4gICAgICAuYXR0cihcIngyXCIsIGF4aXMud2lkdGgoKSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCBzY2FsZS5tKS5hdHRyKFwieTJcIiwgc2NhbGUubSk7XHJcbiAgICBnLnNlbGVjdEFsbChcIi50aWNrbGFiZWxcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxyXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcclxuICAgICAgLmF0dHIoXCJ4XCIsIGF4aXMud2lkdGgoKSAtIHNldHRpbmdzKFwidGlja19sZW5ndGhcIikgLSBzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKSlcclxuICAgICAgLmF0dHIoXCJ5XCIsIHNjYWxlLm0pXHJcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7fSlcclxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgICAuYXR0cihcImR5XCIsIFwiMC4zNWVtXCIpO1xyXG4gICAgZy5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNsaW5lXCIpXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgYXhpcy53aWR0aCgpKS5hdHRyKFwieDJcIiwgYXhpcy53aWR0aCgpKVxyXG4gICAgICAuYXR0cihcInkxXCIsIDApLiBhdHRyKFwieTJcIiwgYXhpcy5oZWlnaHQoKSk7XHJcbiAgfVxyXG5cclxuICBheGlzLndpZHRoID0gZnVuY3Rpb24odykge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgdmFyIHRpY2tzID0gc2NhbGUudGlja3MoKTtcclxuICAgICAgdmFyIG1heF93aWR0aCA9IDA7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGlja3MubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICB2YXIgbHcgPSBsYWJlbF9zaXplXy53aWR0aCh0aWNrc1tpXSk7XHJcbiAgICAgICAgaWYgKGx3ID4gbWF4X3dpZHRoKSBtYXhfd2lkdGggPSBsdztcclxuICAgICAgfVxyXG4gICAgICB3aWR0aCA9IG1heF93aWR0aCArIHNldHRpbmdzKFwidGlja19sZW5ndGhcIikgKyBzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKTsgIFxyXG4gICAgICByZXR1cm4gd2lkdGg7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB3aWR0aCA9IHc7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGhlaWdodDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhlaWdodCA9IGg7XHJcbiAgICAgIHNjYWxlLnJhbmdlKFswLCBoXSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xyXG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XHJcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdzdHJpbmcnIHx8IHZzY2hlbWEudHlwZSA9PSAnY2F0ZWdvcmljYWwnIHx8XHJcbiAgICAgIHZzY2hlbWEudHlwZSA9PSAncGVyaW9kJztcclxuICB9O1xyXG5cclxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHZhcmlhYmxlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyaWFibGUgPSB2O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyIGQgPSBkYXRhLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlXTt9KTtcclxuICAgICAgLy8gZmlsdGVyIG91dCBkdXBsaWNhdGUgdmFsdWVzXHJcbiAgICAgIHZhciBkb21haW4gPSBkLmZpbHRlcihmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIHNlbGYpIHtcclxuICAgICAgICByZXR1cm4gc2VsZi5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXg7XHJcbiAgICAgIH0pO1xyXG4gICAgICBzY2FsZS5kb21haW4oZG9tYWluKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHNjYWxlLnRpY2tzKCk7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcclxuICAgICAgcmV0dXJuIHNjYWxlKHZbdmFyaWFibGVdKS5tO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHNjYWxlKHYpLm07XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZS5sID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxyXG4gICAgICByZXR1cm4gc2NhbGUodlt2YXJpYWJsZV0pLmw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc2NhbGUodikubDtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLnNjYWxlLnUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIHJldHVybiBzY2FsZSh2W3ZhcmlhYmxlXSkudTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzY2FsZSh2KS51O1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUudyA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIHZhciByO1xyXG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxyXG4gICAgICByID0gc2NhbGUodlt2YXJpYWJsZV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgciA9IHNjYWxlKHYpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHIudSAtIHIubDtcclxuICB9O1xyXG5cclxuICByZXR1cm4gYXhpcztcclxufVxyXG5cclxuaWYgKGdycGguYXhpcyA9PT0gdW5kZWZpbmVkKSBncnBoLmF4aXMgPSB7fTtcclxuZ3JwaC5heGlzLmNhdGVnb3JpY2FsID0gZ3JwaF9heGlzX2NhdGVnb3JpY2FsKCk7XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9heGlzX2NobG9yb3BsZXRoKCkge1xyXG5cclxuICB2YXIgdmFyaWFibGU7XHJcbiAgdmFyIHdpZHRoLCBoZWlnaHQ7XHJcbiAgdmFyIHNjYWxlID0gZ3JwaF9zY2FsZV9jaGxvcm9wbGV0aCgpO1xyXG5cclxuICBmdW5jdGlvbiBheGlzKGcpIHtcclxuICB9XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gd2lkdGg7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB3aWR0aCA9IHc7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGhlaWdodDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhlaWdodCA9IGg7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xyXG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XHJcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdudW1iZXInO1xyXG4gIH07XHJcblxyXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFyaWFibGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXJpYWJsZSA9IHY7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gc2NhbGUuZG9tYWluKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAodmFyaWFibGUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XHJcbiAgICAgIHNjYWxlLmRvbWFpbihkMy5leHRlbnQoZGF0YSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV07fSkpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gc2NhbGUudGlja3MoKTtcclxuICB9O1xyXG5cclxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxyXG4gICAgICByZXR1cm4gYXhpcy5zY2FsZSh2W3ZhcmlhYmxlXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc2NhbGUodik7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGF4aXM7XHJcbn1cclxuXHJcbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XHJcbmdycGguYXhpcy5jaGxvcm9wbGV0aCA9IGdycGhfYXhpc19jaGxvcm9wbGV0aCgpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19jb2xvdXIoKSB7XHJcblxyXG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfY29sb3VyKCk7XHJcbiAgdmFyIHZhcmlhYmxlXztcclxuICB2YXIgd2lkdGhfLCBoZWlnaHRfO1xyXG5cclxuICBmdW5jdGlvbiBheGlzKGcpIHtcclxuICB9XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHdpZHRoXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpZHRoXyA9IHdpZHRoO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGhlaWdodF87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoZWlnaHRfID0gaGVpZ2h0O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xyXG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSBcImNhdGVnb3JpY2FsXCIgfHwgdnNjaGVtYS50eXBlID09IFwicGVyaW9kXCI7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB2YXJpYWJsZV87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXJpYWJsZV8gPSB2O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHZhcmlhYmxlXyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcztcclxuICAgICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGVfLCBzY2hlbWEpO1xyXG4gICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xyXG4gICAgICBpZiAodnNjaGVtYS50eXBlID09IFwiY2F0ZWdvcmljYWxcIikge1xyXG4gICAgICAgIGNhdGVnb3JpZXMgPSB2c2NoZW1hLmNhdGVnb3JpZXMubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubmFtZTsgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIHZhbHMgPSBkYXRhLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlX107fSkuc29ydCgpO1xyXG4gICAgICAgIHZhciBwcmV2O1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFscy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgaWYgKHZhbHNbaV0gIT0gcHJldikgY2F0ZWdvcmllcy5wdXNoKFwiXCIgKyB2YWxzW2ldKTtcclxuICAgICAgICAgIHByZXYgPSB2YWxzW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBzY2FsZS5kb21haW4oY2F0ZWdvcmllcyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIHJldHVybiBzY2FsZSh2W3ZhcmlhYmxlX10pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHNjYWxlKHYpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBheGlzO1xyXG59XHJcblxyXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xyXG5ncnBoLmF4aXMuY29sb3VyID0gZ3JwaF9heGlzX2NvbG91cigpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19saW5lYXIoaG9yaXpvbnRhbCkge1xyXG5cclxuICB2YXIgc2NhbGVfID0gZ3JwaF9zY2FsZV9saW5lYXIoKTtcclxuICB2YXIgaG9yaXpvbnRhbF8gPSBob3Jpem9udGFsO1xyXG4gIHZhciB2YXJpYWJsZV87XHJcbiAgdmFyIHdpZHRoXywgaGVpZ2h0XztcclxuICB2YXIgb3JpZ2luXztcclxuICB2YXIgc2V0dGluZ3NfID0ge1xyXG4gICAgXCJ0aWNrX2xlbmd0aFwiIDogNSxcclxuICAgIFwidGlja19wYWRkaW5nXCIgOiAyLFxyXG4gICAgXCJwYWRkaW5nXCIgOiA0XHJcbiAgfTtcclxuXHJcbiAgdmFyIGR1bW15XyA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwibGluZWFyYXhpcyBkdW1teVwiKVxyXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCAwKS5hdHRyKFwiaGVpZ2h0XCIsIDApXHJcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gIHZhciBsYWJlbF9zaXplXyA9IGdycGhfbGFiZWxfc2l6ZShkdW1teV8pO1xyXG4gIGlmIChob3Jpem9udGFsXykgc2NhbGVfLmxhYmVsX3NpemUobGFiZWxfc2l6ZV8ud2lkdGgpO1xyXG4gIGVsc2Ugc2NhbGVfLmxhYmVsX3NpemUobGFiZWxfc2l6ZV8uaGVpZ2h0KTtcclxuICBcclxuXHJcbiAgZnVuY3Rpb24gYXhpcyhnKSB7XHJcbiAgICB2YXIgdyA9IGF4aXMud2lkdGgoKTtcclxuICAgIHZhciB0aWNrcyA9IGF4aXMudGlja3MoKTtcclxuICAgIGcuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgdykuYXR0cihcImhlaWdodFwiLCBheGlzLmhlaWdodCgpKTtcclxuICAgIGlmIChob3Jpem9udGFsKSB7XHJcbiAgICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxyXG4gICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tcIilcclxuICAgICAgICAuYXR0cihcIngxXCIsIHNjYWxlXykuYXR0cihcIngyXCIsIHNjYWxlXylcclxuICAgICAgICAuYXR0cihcInkxXCIsIDApLmF0dHIoXCJ5MlwiLCBzZXR0aW5nc18udGlja19sZW5ndGgpO1xyXG4gICAgICBnLnNlbGVjdEFsbChcIi50aWNrbGFiZWxcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxyXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tsYWJlbFwiKVxyXG4gICAgICAgIC5hdHRyKFwieFwiLCBzY2FsZV8pLmF0dHIoXCJ5XCIsIHNldHRpbmdzXy50aWNrX2xlbmd0aCArIHNldHRpbmdzXy50aWNrX3BhZGRpbmcpXHJcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDt9KVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAuYXR0cihcImR5XCIsIFwiMC43MWVtXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja1wiKS5kYXRhKHRpY2tzKS5lbnRlcigpXHJcbiAgICAgICAgLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIFwidGlja1wiKVxyXG4gICAgICAgIC5hdHRyKFwieDFcIiwgdy1zZXR0aW5nc18udGlja19sZW5ndGgpLmF0dHIoXCJ4MlwiLCB3KVxyXG4gICAgICAgIC5hdHRyKFwieTFcIiwgc2NhbGVfKS5hdHRyKFwieTJcIiwgc2NhbGVfKTtcclxuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja2xhYmVsXCIpLmRhdGEodGlja3MpLmVudGVyKClcclxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcclxuICAgICAgICAuYXR0cihcInhcIiwgc2V0dGluZ3NfLnBhZGRpbmcpLmF0dHIoXCJ5XCIsIHNjYWxlXylcclxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkO30pXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImJlZ2luXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzVlbVwiKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgaWYgKGhvcml6b250YWxfKSB7XHJcbiAgICAgIC8vIGlmIGhvcml6b250YWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZ2l2ZW47IHRoaXMgZGVmaW5lcyB0aGUgcmFuZ2Ugb2ZcclxuICAgICAgLy8gdGhlIHNjYWxlXHJcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIHdpZHRoXztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB3aWR0aF8gPSB3aWR0aDtcclxuICAgICAgICBzY2FsZV8ucmFuZ2UoWzAsIHdpZHRoX10pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBpZiB2ZXJ0aWNhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBkZWZpbmVkIGJ5IHRoZSBncmFwaDogdGhlIHNwYWNlIGl0XHJcbiAgICAgIC8vIG5lZWRzIHRvIGRyYXcgdGhlIHRpY2ttYXJrcyBhbmQgbGFiZWxzIGV0Yy4gXHJcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgdmFyIHRpY2tzID0gc2NhbGVfLnRpY2tzKCk7XHJcbiAgICAgICAgdmFyIHcgPSAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGlja3MubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgIHZhciBsdyA9IGxhYmVsX3NpemVfLndpZHRoKHRpY2tzW2ldKTtcclxuICAgICAgICAgIGlmIChsdyA+IHcpIHcgPSBsdztcclxuICAgICAgICB9XHJcbiAgICAgICAgd2lkdGhfID0gdyArIHNldHRpbmdzXy50aWNrX2xlbmd0aCArIHNldHRpbmdzXy50aWNrX3BhZGRpbmcgKyBzZXR0aW5nc18ucGFkZGluZzsgIFxyXG4gICAgICAgIHJldHVybiB3aWR0aF87XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgd2lkdGhfID0gd2lkdGg7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xyXG4gICAgaWYgKGhvcml6b250YWxfKSB7XHJcbiAgICAgIC8vIGlmIGhvcml6b250YWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZGVmaW5lZCBieSB0aGUgZ3JhcGg6IHRoZSBzcGFjZSBpdFxyXG4gICAgICAvLyBuZWVkcyB0byBkcmF3IHRoZSB0aWNrbWFya3MgYW5kIGxhYmVscyBldGMuIFxyXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHZhciB0aWNrcyA9IHNjYWxlXy50aWNrcygpO1xyXG4gICAgICAgIHZhciBoID0gMDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRpY2tzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICB2YXIgbGggPSBsYWJlbF9zaXplXy5oZWlnaHQodGlja3NbaV0pO1xyXG4gICAgICAgICAgaWYgKGxoID4gaCkgaCA9IGxoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBoZWlnaHRfID0gaCArIHNldHRpbmdzXy50aWNrX2xlbmd0aCArIHNldHRpbmdzXy50aWNrX3BhZGRpbmcgKyBzZXR0aW5nc18ucGFkZGluZzsgXHJcbiAgICAgICAgcmV0dXJuIGhlaWdodF87XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaGVpZ2h0XyA9IGhlaWdodDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gaWYgdmVydGljYWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZ2l2ZW47IHRoaXMgZGVmaW5lcyB0aGUgcmFuZ2Ugb2ZcclxuICAgICAgLy8gdGhlIHNjYWxlXHJcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGhlaWdodF87XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaGVpZ2h0XyA9IGhlaWdodDtcclxuICAgICAgICBzY2FsZV8ucmFuZ2UoW2hlaWdodF8sIDBdKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xyXG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XHJcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdudW1iZXInO1xyXG4gIH07XHJcblxyXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyaWFibGVfID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZV8uZG9tYWluKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgcmFuZ2UgPSBkMy5leHRlbnQoZGF0YSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gK2RbdmFyaWFibGVfXTt9KTtcclxuICAgICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGVfLCBzY2hlbWEpO1xyXG4gICAgICBpZiAodnNjaGVtYS5vcmlnaW4pIG9yaWdpbl8gPSB2c2NoZW1hLm9yaWdpbjtcclxuICAgICAgaWYgKG9yaWdpbl8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmIChyYW5nZVswXSA+IG9yaWdpbl8pIHJhbmdlWzBdID0gb3JpZ2luXztcclxuICAgICAgICBpZiAocmFuZ2VbMV0gPCBvcmlnaW5fKSByYW5nZVsxXSA9IG9yaWdpbl87XHJcbiAgICAgIH1cclxuICAgICAgc2NhbGVfLmRvbWFpbihyYW5nZSkubmljZSgpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLm9yaWdpbiA9IGZ1bmN0aW9uKG9yaWdpbikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIG9yaWdpbl87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBvcmlnaW5fID0gb3JpZ2luO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gc2NhbGVfLnRpY2tzKCk7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcclxuICAgICAgcmV0dXJuIHNjYWxlXyh2W3ZhcmlhYmxlX10pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHNjYWxlXyh2KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXhpcztcclxufVxyXG5cclxuaWYgKGdycGguYXhpcyA9PT0gdW5kZWZpbmVkKSBncnBoLmF4aXMgPSB7fTtcclxuZ3JwaC5heGlzLmxpbmVhciA9IGdycGhfYXhpc19saW5lYXIoKTtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2F4aXNfcGVyaW9kKCkge1xyXG5cclxuICB2YXIgc2NhbGVfID0gZ3JwaF9zY2FsZV9wZXJpb2QoKTtcclxuICB2YXIgaGVpZ2h0XztcclxuICB2YXIgdmFyaWFibGVfO1xyXG4gIHZhciBzZXR0aW5ncyA9IHtcclxuICAgIFwidGlja19sZW5ndGhcIiA6IFsxNSwgMzAsIDQ1XVxyXG4gIH07XHJcblxyXG4gIHZhciBheGlzID0gZnVuY3Rpb24oZykge1xyXG4gICAgdmFyIHRpY2tzID0gc2NhbGVfLnRpY2tzKCk7XHJcblxyXG4gICAgdmFyIHRpY2tfbGVuZ3RoID0ge307XHJcbiAgICB2YXIgdGljayA9IDA7XHJcbiAgICBpZiAoc2NhbGVfLmhhc19tb250aCgpKSB0aWNrX2xlbmd0aC5tb250aCA9IHNldHRpbmdzLnRpY2tfbGVuZ3RoW3RpY2srK107XHJcbiAgICBpZiAoc2NhbGVfLmhhc19xdWFydGVyKCkpIHRpY2tfbGVuZ3RoLnF1YXJ0ZXIgPSBzZXR0aW5ncy50aWNrX2xlbmd0aFt0aWNrKytdO1xyXG4gICAgdGlja19sZW5ndGgueWVhciA9IHNldHRpbmdzLnRpY2tfbGVuZ3RoW3RpY2srK107XHJcblxyXG4gICAgZy5zZWxlY3RBbGwoXCJsaW5lLnRpY2stZW5kXCIpLmRhdGEodGlja3MpLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxyXG4gICAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQpIHsgXHJcbiAgICAgICAgdmFyIGxhc3QgPSBkLmxhc3QgPyBcIiB0aWNrbGFzdFwiIDogXCJcIjtcclxuICAgICAgICByZXR1cm4gXCJ0aWNrIHRpY2tlbmQgdGlja1wiICsgZC50eXBlICsgbGFzdDtcclxuICAgICAgfSlcclxuICAgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBzY2FsZV8oZC5wZXJpb2QuZW5kKTt9KVxyXG4gICAgICAuYXR0cihcInkxXCIsIDApXHJcbiAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gc2NhbGVfKGQucGVyaW9kLmVuZCk7fSlcclxuICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB0aWNrX2xlbmd0aFtkLnR5cGVdO30pO1xyXG4gICAgZy5zZWxlY3RBbGwoXCJsaW5lLnRpY2stc3RhcnRcIikuZGF0YSh0aWNrcykuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXHJcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCkgeyBcclxuICAgICAgICB2YXIgbGFzdCA9IGQubGFzdCA/IFwiIHRpY2tsYXN0XCIgOiBcIlwiO1xyXG4gICAgICAgIHJldHVybiBcInRpY2sgdGlja3N0YXJ0IHRpY2tcIiArIGQudHlwZSArIGxhc3Q7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gc2NhbGVfKGQucGVyaW9kLnN0YXJ0KTt9KVxyXG4gICAgICAuYXR0cihcInkxXCIsIDApXHJcbiAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gc2NhbGVfKGQucGVyaW9kLnN0YXJ0KTt9KVxyXG4gICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHRpY2tfbGVuZ3RoW2QudHlwZV07fSk7XHJcbiAgICBnLnNlbGVjdEFsbChcInRleHRcIikuZGF0YSh0aWNrcykuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0aWNrbGFiZWwgdGlja2xhYmVsXCIgKyBkLnR5cGU7fSlcclxuICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHNjYWxlXyhkLmRhdGUpO30pXHJcbiAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB0aWNrX2xlbmd0aFtkLnR5cGVdO30pXHJcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyBcclxuICAgICAgICBpZiAoZC50eXBlID09IFwibW9udGhcIikge1xyXG4gICAgICAgICAgcmV0dXJuIGQucGVyaW9kLnN0YXJ0LmZvcm1hdChcIk1NTVwiKS5jaGFyQXQoMCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkLnR5cGUgPT0gXCJxdWFydGVyXCIpIHtcclxuICAgICAgICAgIHJldHVybiBcIlFcIiArIGQucGVyaW9kLnN0YXJ0LmZvcm1hdChcIlFcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkLmxhYmVsO1xyXG4gICAgICB9KTtcclxuICB9O1xyXG5cclxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodF8pIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIGlmIChoZWlnaHRfID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB2YXIgdGljayA9IDA7XHJcbiAgICAgICAgaWYgKHNjYWxlXy5oYXNfbW9udGgpIHRpY2srKztcclxuICAgICAgICBpZiAoc2NhbGVfLmhhc19xdWFydGVyKSB0aWNrKys7XHJcbiAgICAgICAgcmV0dXJuIHNldHRpbmdzLnRpY2tfbGVuZ3RoW3RpY2tdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBoZWlnaHRfO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoZWlnaHRfID0gaGVpZ2h0O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHZhciByID0gc2NhbGVfLnJhbmdlKCk7XHJcbiAgICAgIHJldHVybiByWzFdIC0gclswXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNjYWxlXy5yYW5nZShbMCwgd2lkdGhdKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XHJcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcclxuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ2RhdGUnO1xyXG4gIH07XHJcblxyXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyaWFibGVfID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZV8uZG9tYWluKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgZG9tYWluID0gZGF0YS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV9dO30pO1xyXG4gICAgICBzY2FsZV8uZG9tYWluKGRvbWFpbik7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgdGlja3MgPSBzY2FsZV8udGlja3MoKTtcclxuICAgIHJldHVybiB0aWNrcy5maWx0ZXIoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50eXBlID09IFwieWVhclwiO30pO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIGlmICh2Lmhhc093blByb3BlcnR5KFwiZGF0ZVwiKSAmJiB2Lmhhc093blByb3BlcnR5KFwicGVyaW9kXCIpKSB7XHJcbiAgICAgICAgcmV0dXJuIHNjYWxlXyh2KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gc2NhbGVfKHZbdmFyaWFibGVfXSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzY2FsZV8odik7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIHJldHVybiBheGlzO1xyXG59XHJcblxyXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xyXG5ncnBoLmF4aXMucGVyaW9kID0gZ3JwaF9heGlzX3BlcmlvZCgpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19yZWdpb24oKSB7XHJcblxyXG4gIHZhciB2YXJpYWJsZV87XHJcbiAgdmFyIHdpZHRoXywgaGVpZ2h0XztcclxuICB2YXIgbWFwX2xvYWRlZF87XHJcbiAgdmFyIG1hcF87XHJcbiAgdmFyIGluZGV4XyA9IHt9O1xyXG5cclxuICBmdW5jdGlvbiBheGlzKGcpIHtcclxuICB9XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHdpZHRoXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHVwZGF0ZV9wcm9qZWN0aW9uXyA9IHVwZGF0ZV9wcm9qZWN0aW9uXyB8fCB3aWR0aF8gIT0gd2lkdGg7XHJcbiAgICAgIHdpZHRoXyA9IHdpZHRoO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGhlaWdodF87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB1cGRhdGVfcHJvamVjdGlvbl8gPSB1cGRhdGVfcHJvamVjdGlvbl8gfHwgaGVpZ2h0XyAhPSBoZWlnaHQ7XHJcbiAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xyXG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XHJcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdzdHJpbmcnO1xyXG4gIH07XHJcblxyXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyaWFibGVfID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gVmFyaWFibGUgYW5kIGZ1bmN0aW9uIHRoYXQga2VlcHMgdHJhY2sgb2Ygd2hldGhlciBvciBub3QgdGhlIG1hcCBoYXMgXHJcbiAgLy8gZmluaXNoZWQgbG9hZGluZy4gVGhlIG1ldGhvZCBkb21haW4oKSBsb2FkcyB0aGUgbWFwLiBIb3dldmVyLCB0aGlzIGhhcHBlbnNcclxuICAvLyBhc3luY2hyb25vdXNseS4gVGhlcmVmb3JlLCBpdCBpcyBwb3NzaWJsZSAoYW5kIG9mdGVuIGhhcHBlbnMpIHRoYXQgdGhlIG1hcFxyXG4gIC8vIGhhcyBub3QgeWV0IGxvYWRlZCB3aGVuIHNjYWxlKCkgYW5kIHRyYW5zZm9ybSgpIGFyZSBjYWxsZWQuIFRoZSBjb2RlIFxyXG4gIC8vIGNhbGxpbmcgdGhlc2UgbWV0aG9kcyB0aGVyZWZvcmUgbmVlZHMgdG8gd2FpdCB1bnRpbCB0aGUgbWFwIGhhcyBsb2FkZWQuIFxyXG4gIHZhciBtYXBfbG9hZGluZ18gPSBmYWxzZTsgXHJcbiAgYXhpcy5tYXBfbG9hZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gIW1hcF9sb2FkaW5nXztcclxuICB9O1xyXG5cclxuICBmdW5jdGlvbiBsb2FkX21hcChkYXRhLCBzY2hlbWEsIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAodmFyaWFibGVfID09PSB1bmRlZmluZWQpIHJldHVybiA7IC8vIFRPRE9cclxuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcclxuICAgIGlmICh2c2NoZW1hLm1hcCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gOyAvLyBUT0RPXHJcbiAgICBpZiAodnNjaGVtYS5tYXAgPT0gbWFwX2xvYWRlZF8pIHJldHVybjsgXHJcbiAgICBtYXBfbG9hZGluZ18gPSB0cnVlO1xyXG4gICAgLy8gVE9ETyBoYW5kbGUgZXJyb3JzIGluIGQzLmpzb25cclxuICAgIGQzLmpzb24odnNjaGVtYS5tYXAsIGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgbWFwX2xvYWRlZF8gPSB2c2NoZW1hLm1hcDtcclxuICAgICAgY2FsbGJhY2soanNvbik7XHJcbiAgICAgIG1hcF9sb2FkaW5nXyA9IGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgLy9yZXR1cm4gc2NhbGUuZG9tYWluKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsb2FkX21hcChkYXRhLCBzY2hlbWEsIGZ1bmN0aW9uKG1hcCkge1xyXG4gICAgICAgIG1hcF8gPSBtYXA7XHJcbiAgICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gdHJ1ZTtcclxuICAgICAgICAvLyBidWlsZCBpbmRleCBtYXBwaW5nIHJlZ2lvbiBuYW1lIG9uIGZlYXR1cmVzIFxyXG4gICAgICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcclxuICAgICAgICB2YXIgcmVnaW9uaWQgPSB2c2NoZW1hLnJlZ2lvbmlkIHx8IFwiaWRcIjtcclxuICAgICAgICBmb3IgKHZhciBmZWF0dXJlIGluIG1hcF8uZmVhdHVyZXMpIHtcclxuICAgICAgICAgIHZhciBuYW1lID0gbWFwXy5mZWF0dXJlc1tmZWF0dXJlXS5wcm9wZXJ0aWVzW3JlZ2lvbmlkXTtcclxuICAgICAgICAgIGluZGV4X1tuYW1lXSA9IGZlYXR1cmU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcclxuICAgICAgcmV0dXJuIGF4aXMuc2NhbGUodlt2YXJpYWJsZV9dKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGF4aXMudXBkYXRlX3Byb2plY3Rpb24oKTtcclxuICAgICAgcmV0dXJuIHBhdGhfKG1hcF8uZmVhdHVyZXNbaW5kZXhfW3ZdXSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gVGhlIHByb2plY3Rpb24uIENhbGN1bGF0aW5nIHRoZSBzY2FsZSBhbmQgdHJhbnNsYXRpb24gb2YgdGhlIHByb2plY3Rpb24gXHJcbiAgLy8gdGFrZXMgdGltZS4gVGhlcmVmb3JlLCB3ZSBvbmx5IHdhbnQgdG8gZG8gdGhhdCB3aGVuIG5lY2Vzc2FyeS4gXHJcbiAgLy8gdXBkYXRlX3Byb2plY3Rpb25fIGtlZXBzIHRyYWNrIG9mIHdoZXRoZXIgb3Igbm90IHRoZSBwcm9qZWN0aW9uIG5lZWRzIFxyXG4gIC8vIHJlY2FsY3VsYXRpb25cclxuICB2YXIgdXBkYXRlX3Byb2plY3Rpb25fID0gdHJ1ZTtcclxuICAvLyB0aGUgcHJvamVjdGlvblxyXG4gIHZhciBwcm9qZWN0aW9uXyA9IGQzLmdlby50cmFuc3ZlcnNlTWVyY2F0b3IoKVxyXG4gICAgLnJvdGF0ZShbLTUuMzg3MjA2MjEsIC01Mi4xNTUxNzQ0MF0pLnNjYWxlKDEpLnRyYW5zbGF0ZShbMCwwXSk7XHJcbiAgdmFyIHBhdGhfID0gZDMuZ2VvLnBhdGgoKS5wcm9qZWN0aW9uKHByb2plY3Rpb25fKTtcclxuICAvLyBmdW5jdGlvbiB0aGF0IHJlY2FsY3VsYXRlcyB0aGUgc2NhbGUgYW5kIHRyYW5zbGF0aW9uIG9mIHRoZSBwcm9qZWN0aW9uXHJcbiAgYXhpcy51cGRhdGVfcHJvamVjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKHVwZGF0ZV9wcm9qZWN0aW9uXyAmJiBtYXBfKSB7XHJcbiAgICAgIHByb2plY3Rpb25fLnNjYWxlKDEpLnRyYW5zbGF0ZShbMCwwXSk7XHJcbiAgICAgIHBhdGhfID0gZDMuZ2VvLnBhdGgoKS5wcm9qZWN0aW9uKHByb2plY3Rpb25fKTtcclxuICAgICAgdmFyIGJvdW5kcyA9IHBhdGhfLmJvdW5kcyhtYXBfKTtcclxuICAgICAgdmFyIHNjYWxlICA9IDAuOTUgLyBNYXRoLm1heCgoYm91bmRzWzFdWzBdIC0gYm91bmRzWzBdWzBdKSAvIHdpZHRoXywgXHJcbiAgICAgICAgICAgICAgICAgIChib3VuZHNbMV1bMV0gLSBib3VuZHNbMF1bMV0pIC8gaGVpZ2h0Xyk7XHJcbiAgICAgIHZhciB0cmFuc2wgPSBbKHdpZHRoXyAtIHNjYWxlICogKGJvdW5kc1sxXVswXSArIGJvdW5kc1swXVswXSkpIC8gMiwgXHJcbiAgICAgICAgICAgICAgICAgIChoZWlnaHRfIC0gc2NhbGUgKiAoYm91bmRzWzFdWzFdICsgYm91bmRzWzBdWzFdKSkgLyAyXTtcclxuICAgICAgcHJvamVjdGlvbl8uc2NhbGUoc2NhbGUpLnRyYW5zbGF0ZSh0cmFuc2wpO1xyXG4gICAgICB1cGRhdGVfcHJvamVjdGlvbl8gPSBmYWxzZTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcbiAgcmV0dXJuIGF4aXM7XHJcbn1cclxuXHJcbi8vIEEgZnVuY3Rpb24gZXhwZWN0aW5nIHR3byBmdW5jdGlvbnMuIFRoZSBzZWNvbmQgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gdGhlIFxyXG4vLyBmaXJzdCBmdW5jdGlvbiByZXR1cm5zIHRydWUuIFdoZW4gdGhlIGZpcnN0IGZ1bmN0aW9uIGRvZXMgbm90IHJldHVybiB0cnVlXHJcbi8vIHdlIHdhaXQgZm9yIDEwMG1zIGFuZCB0cnkgYWdhaW4uIFxyXG52YXIgd2FpdF9mb3IgPSBmdW5jdGlvbihtLCBmKSB7XHJcbiAgaWYgKG0oKSkge1xyXG4gICAgZigpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB3YWl0X2ZvcihtLCBmKTt9LCAxMDApO1xyXG4gIH1cclxufTtcclxuXHJcbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XHJcbmdycGguYXhpcy5saW5lYXIgPSBncnBoX2F4aXNfbGluZWFyKCk7XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9heGlzX3NpemUoKSB7XHJcblxyXG4gIHZhciB2YXJpYWJsZV87XHJcbiAgdmFyIHdpZHRoLCBoZWlnaHQ7XHJcbiAgdmFyIHNjYWxlID0gZ3JwaF9zY2FsZV9zaXplKCk7XHJcblxyXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xyXG4gIH1cclxuXHJcbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHcpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB3aWR0aDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpZHRoID0gdztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gaGVpZ2h0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGVpZ2h0ID0gaDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XHJcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcclxuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ251bWJlcic7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB2YXJpYWJsZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhcmlhYmxlID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZS5kb21haW4oKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh2YXJpYWJsZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcztcclxuICAgICAgc2NhbGUuZG9tYWluKGQzLmV4dGVudChkYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlXTt9KSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIHJldHVybiBheGlzLnNjYWxlKHZbdmFyaWFibGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXhpcztcclxufVxyXG5cclxuaWYgKGdycGguYXhpcyA9PT0gdW5kZWZpbmVkKSBncnBoLmF4aXMgPSB7fTtcclxuZ3JwaC5heGlzLnNpemUgPSBncnBoX2F4aXNfc2l6ZSgpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19zcGxpdCgpIHtcclxuXHJcbiAgdmFyIHZhcmlhYmxlXztcclxuICB2YXIgd2lkdGhfLCBoZWlnaHRfO1xyXG4gIHZhciBkb21haW5fO1xyXG4gIHZhciB0aWNrc187XHJcbiAgdmFyIHNldHRpbmdzXyA9IHtcclxuICB9O1xyXG5cclxuICBmdW5jdGlvbiBheGlzKGcpIHtcclxuICB9XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHdpZHRoXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpZHRoXyA9IHdpZHRoO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGhlaWdodF87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoZWlnaHRfID0gaGVpZ2h0O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xyXG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSBcImNhdGVnb3JpY2FsXCIgfHwgdnNjaGVtYS50eXBlID09IFwicGVyaW9kXCI7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB2YXJpYWJsZV87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXJpYWJsZV8gPSB2O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG4gXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBkb21haW5fO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHZhcmlhYmxlXyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcztcclxuICAgICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGVfLCBzY2hlbWEpO1xyXG4gICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xyXG4gICAgICBpZiAodnNjaGVtYS50eXBlID09IFwiY2F0ZWdvcmljYWxcIikge1xyXG4gICAgICAgIGNhdGVnb3JpZXMgPSB2c2NoZW1hLmNhdGVnb3JpZXMubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubmFtZTsgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIHZhbHMgPSBkYXRhLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlX107fSkuc29ydCgpO1xyXG4gICAgICAgIHZhciBwcmV2O1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFscy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgaWYgKHZhbHNbaV0gIT0gcHJldikgY2F0ZWdvcmllcy5wdXNoKFwiXCIgKyB2YWxzW2ldKTtcclxuICAgICAgICAgIHByZXYgPSB2YWxzW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBkb21haW5fID0gY2F0ZWdvcmllcztcclxuICAgICAgdmFyIGZvcm1hdCA9IHZhcmlhYmxlX3ZhbHVlX2Zvcm1hdHRlcih2YXJpYWJsZV8sIHNjaGVtYSk7XHJcbiAgICAgIHRpY2tzXyA9IGRvbWFpbl8ubWFwKGZvcm1hdCk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aWNrc187XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIHJldHVybiBkb21haW5fLmluZGV4T2Yodik7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGF4aXM7XHJcbn1cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19zd2l0Y2goYXhlcykge1xyXG5cclxuICB2YXIgdHlwZSA9IDA7XHJcblxyXG4gIHZhciBheGlzID0gZnVuY3Rpb24oZykge1xyXG4gICAgcmV0dXJuIGF4ZXNbdHlwZV0oZyk7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHRfKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gYXhlc1t0eXBlXS5oZWlnaHQoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZvciAodmFyIGk9MDsgaTxheGVzLmxlbmd0aDsgKytpKSBheGVzW2ldLmhlaWdodChoZWlnaHRfKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gYXhlc1t0eXBlXS53aWR0aCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZm9yICh2YXIgaT0wOyBpPGF4ZXMubGVuZ3RoOyArK2kpIGF4ZXNbaV0ud2lkdGgod2lkdGgpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICAgIGZvciAodmFyIGk9MDsgaTxheGVzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIGlmIChheGVzW2ldLmFjY2VwdCh2YXJpYWJsZSwgc2NoZW1hKSlcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9O1xyXG5cclxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGF4ZXNbdHlwZV0udmFyaWFibGUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZvciAodmFyIGk9MDsgaTxheGVzLmxlbmd0aDsgKytpKSBheGVzW2ldLnZhcmlhYmxlKHYpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGF4ZXNbdHlwZV0udmFyaWFibGUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4aXMudmFyaWFibGUoKTtcclxuICAgICAgZm9yICh2YXIgaT0wOyBpPGF4ZXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICBpZiAoYXhlc1tpXS5hY2NlcHQodmFyaWFibGUsIHNjaGVtYSkpIHtcclxuICAgICAgICAgIHR5cGUgPSBpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGF4ZXNbdHlwZV0uZG9tYWluKGRhdGEsIHNjaGVtYSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gYXhlc1t0eXBlXS50aWNrcygpO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICByZXR1cm4gYXhlc1t0eXBlXS5zY2FsZSh2KTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gYXhpcztcclxufVxyXG4iLCJcclxuZnVuY3Rpb24gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHNjaGVtYS5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgIGlmIChzY2hlbWEuZmllbGRzW2ldLm5hbWUgPT0gdmFyaWFibGUpIFxyXG4gICAgICByZXR1cm4gc2NoZW1hLmZpZWxkc1tpXTtcclxuICB9XHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG5cclxuZnVuY3Rpb24gdmFyaWFibGVfdmFsdWVfZm9ybWF0dGVyKHZhcmlhYmxlLCBzY2hlbWEpe1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc2NoZW1hLmZpZWxkcy5sZW5ndGg7IGkrKyl7XHJcblx0XHR2YXIgZmllbGQgPSBzY2hlbWEuZmllbGRzW2ldO1xyXG5cdCAgICBpZiAoZmllbGQubmFtZSA9PSB2YXJpYWJsZSl7XHJcblx0XHRcdHN3aXRjaChmaWVsZC50eXBlKXtcclxuXHRcdFx0XHRjYXNlIFwibnVtYmVyXCI6e1xyXG5cdFx0XHRcdFx0cmV0dXJuIG51bWJlcl9mb3JtYXR0ZXIoZmllbGQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXNlIFwiY2F0ZWdvcmljYWxcIjp7XHJcblx0XHRcdFx0XHRyZXR1cm4gY2F0ZWdvcmljYWxfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FzZSBcInN0cmluZ1wiOntcclxuXHRcdFx0XHRcdHJldHVybiBjYXRlZ29yaWNhbF9mb3JtYXR0ZXIoZmllbGQpO1xyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdGRlZmF1bHQ6e1xyXG5cdFx0XHRcdFx0cmV0dXJuIGRlZmF1bHRfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHQgICAgfVxyXG5cdH1cclxuXHRyZXR1cm4gZGVmYXVsdF9mb3JtYXR0ZXIoKTtcclxufVxyXG4vLyBjcmVhdGVzIGEgZm9ybWF0dGVyIGZvciBwcmV0dHkgcHJpbnRpbmcgdmFsdWVzIGZvciBhIHNwZWNpZmljIGZpZWxkIFxyXG5mdW5jdGlvbiB2YWx1ZV9mb3JtYXR0ZXIoc2NoZW1hKXtcclxuXHR2YXIgZm9ybWF0dGVycyA9IHt9O1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc2NoZW1hLmZpZWxkcy5sZW5ndGg7IGkrKyl7XHJcblx0XHR2YXIgZmllbGQgPSBzY2hlbWEuZmllbGRzW2ldO1xyXG5cdFx0c3dpdGNoKGZpZWxkLnR5cGUpe1xyXG5cdFx0XHRjYXNlIFwibnVtYmVyXCI6e1xyXG5cdFx0XHRcdGZvcm1hdHRlcnNbZmllbGQubmFtZV0gPSBudW1iZXJfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXNlIFwiY2F0ZWdvcmljYWxcIjp7XHJcblx0XHRcdFx0Zm9ybWF0dGVyc1tmaWVsZC5uYW1lXSA9IGNhdGVnb3JpY2FsX2Zvcm1hdHRlcihmaWVsZCk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2FzZSBcInN0cmluZ1wiOntcclxuXHRcdFx0XHRmb3JtYXR0ZXJzW2ZpZWxkLm5hbWVdID0gY2F0ZWdvcmljYWxfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRkZWZhdWx0OntcclxuXHRcdFx0XHRmb3JtYXR0ZXJzW2ZpZWxkLm5hbWVdID0gZGVmYXVsdF9mb3JtYXR0ZXIoZmllbGQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZnVuY3Rpb24oZGF0dW0sIG5hbWUpe1xyXG5cdFx0cmV0dXJuIGZvcm1hdHRlcnNbbmFtZV0oZGF0dW1bbmFtZV0pO1xyXG5cdH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZmF1bHRfZm9ybWF0dGVyKGZpZWxkKXtcclxuXHRyZXR1cm4gZnVuY3Rpb24odmFsdWUpe1xyXG5cdFx0cmV0dXJuIHZhbHVlO1xyXG5cdH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhdGVnb3JpY2FsX2Zvcm1hdHRlcihmaWVsZCl7XHJcblx0dmFyIGNhdF90aXRsZXMgPSB7fTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkLmNhdGVnb3JpZXMubGVuZ3RoOyBpKyspe1xyXG5cdFx0dmFyIGNhdCA9IGZpZWxkLmNhdGVnb3JpZXNbaV07XHJcblx0XHRjYXRfdGl0bGVzW2NhdC5uYW1lXSA9IGNhdC50aXRsZSB8fCBjYXQubmFtZTtcclxuXHR9XHJcblx0cmV0dXJuIGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRcdHJldHVybiBjYXRfdGl0bGVzW3ZhbHVlXTtcclxuXHR9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBudW1iZXJfZm9ybWF0dGVyKGZpZWxkKXtcclxuXHQvL1RPRE8gdXNlIHJvdW5kaW5nP1xyXG5cdHJldHVybiBmdW5jdGlvbih2YWx1ZSl7XHJcblx0XHRyZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcclxuXHR9O1xyXG59XHJcbiIsIlxyXG5cclxuZnVuY3Rpb24gZGF0ZV9wZXJpb2Qoc3RyKSB7XHJcblxyXG4gIGZ1bmN0aW9uIGlzX3llYXIocGVyaW9kKSB7XHJcbiAgICAvLyBzdGFydGluZyBtb250aCBzaG91bGQgYmUgMFxyXG4gICAgaWYgKHBlcmlvZC5zdGFydC5tb250aCgpICE9PSAwKSByZXR1cm4gZmFsc2U7XHJcbiAgICAvLyBzdGFydGluZyBkYXkgb2YgbW9udGggc2hvdWxkIGJlIDFcclxuICAgIGlmIChwZXJpb2Quc3RhcnQuZGF0ZSgpICE9IDEpIHJldHVybiBmYWxzZTtcclxuICAgIC8vIGxlbmd0aCBzaG91bGQgYmUgMSB5ZWFyXHJcbiAgICByZXR1cm4gcGVyaW9kLmxlbmd0aChcInllYXJzXCIpID09IDE7XHJcbiAgfVxyXG4gIGZ1bmN0aW9uIGlzX3F1YXJ0ZXIocGVyaW9kKSB7XHJcbiAgICAvLyBzdGFydGluZyBtb250aCBzaG91bGQgYmUgMCwgMywgNiwgb3IgOVxyXG4gICAgaWYgKChwZXJpb2Quc3RhcnQubW9udGgoKSAlIDMpICE9PSAwKSByZXR1cm4gZmFsc2U7XHJcbiAgICAvLyBzdGFydGluZyBkYXkgb2YgbW9udGggc2hvdWxkIGJlIDFcclxuICAgIGlmIChwZXJpb2Quc3RhcnQuZGF0ZSgpICE9IDEpIHJldHVybiBmYWxzZTtcclxuICAgIC8vIGxlbmd0aCBzaG91bGQgYmUgMyBtb250aHNcclxuICAgIHJldHVybiBwZXJpb2QubGVuZ3RoKFwibW9udGhzXCIpID09IDM7XHJcbiAgfVxyXG4gIGZ1bmN0aW9uIGlzX21vbnRoKHBlcmlvZCkge1xyXG4gICAgLy8gc3RhcnRpbmcgZGF5IG9mIG1vbnRoIHNob3VsZCBiZSAxXHJcbiAgICBpZiAocGVyaW9kLnN0YXJ0LmRhdGUoKSAhPSAxKSByZXR1cm4gZmFsc2U7XHJcbiAgICAvLyBsZW5ndGggc2hvdWxkIGJlIDEgbW9udGhzXHJcbiAgICByZXR1cm4gcGVyaW9kLmxlbmd0aChcIm1vbnRoc1wiKSA9PSAxO1xyXG4gIH1cclxuXHJcbiAgdmFyIGJhc2ljX3llYXJfcmVnZXhwID0gL14oXFxkezR9KSQvO1xyXG4gIHZhciBiYXNpY19tb250aF9yZWdleHAgPSAvXihcXGR7NH0pW01tLV17MX0oXFxkezEsMn0pJC87XHJcbiAgdmFyIGJhc2ljX3F1YXJ0ZXJfcmVnZXhwID0gL14oXFxkezR9KVtRcV17MX0oXFxkezEsMn0pJC87XHJcblxyXG4gIHZhciB0MCwgZHQsIHAsIHQsIHllYXI7XHJcbiAgaWYgKGJhc2ljX3llYXJfcmVnZXhwLnRlc3Qoc3RyKSkge1xyXG4gICAgc3RyID0gYmFzaWNfeWVhcl9yZWdleHAuZXhlYyhzdHIpO1xyXG4gICAgeWVhciA9ICtzdHJbMV07XHJcbiAgICB0MCA9IG1vbWVudChbK3N0clsxXV0pO1xyXG4gICAgZHQgPSBtb21lbnQuZHVyYXRpb24oMSwgXCJ5ZWFyXCIpO1xyXG4gICAgcCAgPSBkdC5hZnRlck1vbWVudCh0MCk7XHJcbiAgICB0ICA9IHQwLmFkZChtb21lbnQuZHVyYXRpb24ocC5sZW5ndGgoKS8yKSk7XHJcbiAgICByZXR1cm4ge3R5cGU6IFwieWVhclwiLCBkYXRlOiB0LCBwZXJpb2Q6IHB9O1xyXG4gIH0gZWxzZSBpZiAoYmFzaWNfbW9udGhfcmVnZXhwLnRlc3Qoc3RyKSkge1xyXG4gICAgc3RyID0gYmFzaWNfbW9udGhfcmVnZXhwLmV4ZWMoc3RyKTtcclxuICAgIHQwID0gbW9tZW50KFsrc3RyWzFdLCArc3RyWzJdLTFdKTtcclxuICAgIGR0ID0gbW9tZW50LmR1cmF0aW9uKDEsIFwibW9udGhcIik7XHJcbiAgICBwICA9IGR0LmFmdGVyTW9tZW50KHQwKTtcclxuICAgIHQgID0gdDAuYWRkKG1vbWVudC5kdXJhdGlvbihwLmxlbmd0aCgpLzIpKTtcclxuICAgIHJldHVybiB7dHlwZTogXCJtb250aFwiLCBkYXRlOiB0LCBwZXJpb2Q6IHB9O1xyXG4gIH0gZWxzZSBpZiAoYmFzaWNfcXVhcnRlcl9yZWdleHAudGVzdChzdHIpKSB7XHJcbiAgICBzdHIgPSBiYXNpY19xdWFydGVyX3JlZ2V4cC5leGVjKHN0cik7XHJcbiAgICB5ZWFyICAgID0gK3N0clsxXTtcclxuICAgIHZhciBxdWFydGVyID0gK3N0clsyXTtcclxuICAgIHQwID0gbW9tZW50KFsrc3RyWzFdLCAoK3N0clsyXS0xKSozXSk7XHJcbiAgICBkdCA9IG1vbWVudC5kdXJhdGlvbigzLCBcIm1vbnRoXCIpO1xyXG4gICAgcCAgPSBkdC5hZnRlck1vbWVudCh0MCk7XHJcbiAgICB0ICA9IHQwLmFkZChtb21lbnQuZHVyYXRpb24ocC5sZW5ndGgoKS8yKSk7XHJcbiAgICByZXR1cm4ge3R5cGU6IFwicXVhcnRlclwiLCBkYXRlOiB0LCBwZXJpb2Q6IHB9O1xyXG4gIH0gZWxzZSBpZiAodHlwZW9mKHN0cikgPT0gXCJzdHJpbmdcIikge1xyXG4gICAgc3RyID0gc3RyLnNwbGl0KFwiL1wiKTtcclxuICAgIHQwICAgPSBtb21lbnQoc3RyWzBdLCBtb21lbnQuSVNPXzg2MDEpO1xyXG4gICAgaWYgKHN0ci5sZW5ndGggPT0gMSkge1xyXG4gICAgICBkdCA9IG1vbWVudC5kdXJhdGlvbigwKTtcclxuICAgICAgcmV0dXJuIHt0eXBlOiBcImRhdGVcIiwgZGF0ZTogdDAsIHBlcmlvZDogZHQuYWZ0ZXJNb21lbnQodDApfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGR0ID0gbW9tZW50LmR1cmF0aW9uKHN0clsxXSk7XHJcbiAgICAgIHAgID0gZHQuYWZ0ZXJNb21lbnQodDApO1xyXG4gICAgICB0ICA9IHQwLmFkZChtb21lbnQuZHVyYXRpb24ocC5sZW5ndGgoKS8yKSk7XHJcbiAgICAgIHZhciB0eXBlID0gXCJwZXJpb2RcIjtcclxuICAgICAgaWYgKGlzX3llYXIocCkpIHsgXHJcbiAgICAgICAgdHlwZSA9IFwieWVhclwiO1xyXG4gICAgICB9IGVsc2UgaWYgKGlzX3F1YXJ0ZXIocCkpIHsgXHJcbiAgICAgICAgdHlwZSA9IFwicXVhcnRlclwiO1xyXG4gICAgICB9IGVsc2UgaWYgKGlzX21vbnRoKHApKSB7XHJcbiAgICAgICAgdHlwZSA9IFwibW9udGhcIjtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge3R5cGU6IHR5cGUsIGRhdGU6IHQsIHBlcmlvZDogcH07XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIHQwICAgPSBtb21lbnQoc3RyKTtcclxuICAgIGR0ID0gbW9tZW50LmR1cmF0aW9uKDApO1xyXG4gICAgcmV0dXJuIHt0eXBlOiBcImRhdGVcIiwgZGF0ZTogdDAsIHBlcmlvZDogZHQuYWZ0ZXJNb21lbnQodDApfTtcclxuICB9XHJcbn1cclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2dlbmVyaWNfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIHR5cGUsIGdyYXBoX3BhbmVsKSB7XHJcblxyXG4gIHZhciBkdW1teV8gPSBkMy5zZWxlY3QoXCJib2R5XCIpLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcImR1bW15IGdyYXBoIGdyYXBoLVwiICsgdHlwZSlcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgMCkuYXR0cihcImhlaWdodFwiLCAwKVxyXG4gICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICB2YXIgbGFiZWxfc2l6ZV8gPSBncnBoX2xhYmVsX3NpemUoZHVtbXlfKTtcclxuXHJcblxyXG4gIHZhciBncmFwaCA9IGdycGhfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIGZ1bmN0aW9uKGcpIHtcclxuICAgIGZ1bmN0aW9uIG5lc3RfY29sdW1uKGQpIHtcclxuICAgICAgcmV0dXJuIGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sdW1uLnZhcmlhYmxlKCldIDogMTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIG5lc3Rfcm93KGQpIHtcclxuICAgICAgcmV0dXJuIGF4ZXMucm93LnZhcmlhYmxlKCkgPyBkW2F4ZXMucm93LnZhcmlhYmxlKCldIDogMTtcclxuICAgIH1cclxuICAgIC8vIHNldHVwIGF4ZXNcclxuICAgIGZvciAodmFyIGF4aXMgaW4gYXhlcykgYXhlc1theGlzXS5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcbiAgICAvLyBkZXRlcm1pbmUgbnVtYmVyIG9mIHJvd3MgYW5kIGNvbHVtbnNcclxuICAgIHZhciBuY29sID0gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGF4ZXMuY29sdW1uLnRpY2tzKCkubGVuZ3RoIDogMTtcclxuICAgIHZhciBucm93ID0gYXhlcy5yb3cudmFyaWFibGUoKSA/IGF4ZXMucm93LnRpY2tzKCkubGVuZ3RoIDogMTtcclxuICAgIC8vIGdldCBsYWJlbHMgYW5kIGRldGVybWluZSB0aGVpciBoZWlnaHRcclxuICAgIHZhciB2c2NoZW1heCA9IHZhcmlhYmxlX3NjaGVtYShheGVzLngudmFyaWFibGUoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG4gICAgdmFyIHhsYWJlbCA9IHZzY2hlbWF4LnRpdGxlO1xyXG4gICAgdmFyIGxhYmVsX2hlaWdodCA9IGxhYmVsX3NpemVfLmhlaWdodCh4bGFiZWwpICsgc2V0dGluZ3MoJ2xhYmVsX3BhZGRpbmcnKTtcclxuICAgIHZhciB2c2NoZW1heSA9IHZhcmlhYmxlX3NjaGVtYShheGVzLnkudmFyaWFibGUoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG4gICAgdmFyIHlsYWJlbCA9IHZzY2hlbWF5LnRpdGxlO1xyXG4gICAgLy8gc2V0IHRoZSB3aWR0aCwgaGVpZ2h0IGVuZCBkb21haW4gb2YgdGhlIHgtIGFuZCB5LWF4ZXMuIFdlIG5lZWQgc29tZSBcclxuICAgIC8vIGl0ZXJhdGlvbnMgZm9yIHRoaXMsIGFzIHRoZSBoZWlnaHQgb2YgdGhlIHktYXhpcyBkZXBlbmRzIG9mIHRoZSBoZWlnaHRcclxuICAgIC8vIG9mIHRoZSB4LWF4aXMsIHdoaWNoIGRlcGVuZHMgb24gdGhlIGxhYmVscyBvZiB0aGUgeC1heGlzLCB3aGljaCBkZXBlbmRzXHJcbiAgICAvLyBvbiB0aGUgd2lkdGggb2YgdGhlIHgtYXhpcywgZXRjLiBcclxuICAgIHZhciByb3dsYWJlbF93aWR0aCA9IGF4ZXMucm93LnZhcmlhYmxlKCkgPyAzKmxhYmVsX2hlaWdodCA6IDA7XHJcbiAgICB2YXIgY29sdW1ubGFiZWxfaGVpZ2h0ID0gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IDMqbGFiZWxfaGVpZ2h0IDogMDtcclxuICAgIHZhciB3LCBoO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyArK2kpIHtcclxuICAgICAgdyA9IGdyYXBoLndpZHRoKCkgLSBzZXR0aW5ncygncGFkZGluZycpWzFdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVszXSAtIFxyXG4gICAgICAgIGF4ZXMueS53aWR0aCgpIC0gbGFiZWxfaGVpZ2h0IC0gcm93bGFiZWxfd2lkdGg7XHJcbiAgICAgIHcgPSAodyAtIChuY29sLTEpKnNldHRpbmdzKCdzZXAnKSkgLyBuY29sO1xyXG4gICAgICBheGVzLngud2lkdGgodykuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG4gICAgICBoID0gZ3JhcGguaGVpZ2h0KCkgLSBzZXR0aW5ncygncGFkZGluZycpWzBdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXSAtIFxyXG4gICAgICAgIGF4ZXMueC5oZWlnaHQoKSAtIGxhYmVsX2hlaWdodCAtIGNvbHVtbmxhYmVsX2hlaWdodDtcclxuICAgICAgaCA9IChoIC0gKG5yb3ctMSkqc2V0dGluZ3MoJ3NlcCcpKSAvIG5yb3c7XHJcbiAgICAgIGF4ZXMueS5oZWlnaHQoaCkuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG4gICAgfVxyXG4gICAgdmFyIGwgPSBheGVzLnkud2lkdGgoKSArIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gKyBsYWJlbF9oZWlnaHQ7XHJcbiAgICB2YXIgdCAgPSBzZXR0aW5ncygncGFkZGluZycpWzJdICsgY29sdW1ubGFiZWxfaGVpZ2h0O1xyXG4gICAgLy8gY3JlYXRlIGdyb3VwIGNvbnRhaW5pbmcgY29tcGxldGUgZ3JhcGhcclxuICAgIGcgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiZ3JhcGggZ3JhcGgtXCIgKyB0eXBlKTtcclxuICAgIC8vIGRyYXcgbGFiZWxzXHJcbiAgICB2YXIgeWNlbnRlciA9IHQgKyAwLjUqKGdyYXBoLmhlaWdodCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVswXSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMl0gLSBcclxuICAgICAgICBheGVzLnguaGVpZ2h0KCkgLSBsYWJlbF9oZWlnaHQpO1xyXG4gICAgdmFyIHhjZW50ZXIgPSBsICsgMC41KihncmFwaC53aWR0aCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSAtIHNldHRpbmdzKCdwYWRkaW5nJylbM10gLSBcclxuICAgICAgICBheGVzLnkud2lkdGgoKSAtIGxhYmVsX2hlaWdodCk7XHJcbiAgICBnLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwibGFiZWwgbGFiZWwteVwiKVxyXG4gICAgICAuYXR0cihcInhcIiwgc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSkuYXR0cihcInlcIiwgeWNlbnRlcilcclxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS50ZXh0KHlsYWJlbClcclxuICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoOTAgXCIgKyBzZXR0aW5ncygncGFkZGluZycpWzFdICsgXCIgXCIgKyB5Y2VudGVyICsgXCIpXCIpO1xyXG4gICAgZy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsIGxhYmVsLXhcIilcclxuICAgICAgLmF0dHIoXCJ4XCIsIHhjZW50ZXIpLmF0dHIoXCJ5XCIsIGdyYXBoLmhlaWdodCgpLXNldHRpbmdzKCdwYWRkaW5nJylbMF0pXHJcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dCh4bGFiZWwpO1xyXG4gICAgaWYgKGF4ZXMucm93LnZhcmlhYmxlKCkpIHtcclxuICAgICAgdmFyIHhyb3cgPSBncmFwaC53aWR0aCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVszXSAtIGxhYmVsX2hlaWdodDtcclxuICAgICAgdmFyIHZzY2hlbWFyb3cgPSB2YXJpYWJsZV9zY2hlbWEoYXhlcy5yb3cudmFyaWFibGUoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG4gICAgICB2YXIgcm93bGFiZWwgPSB2c2NoZW1hcm93LnRpdGxlO1xyXG4gICAgICBnLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwibGFiZWwgbGFiZWwteVwiKVxyXG4gICAgICAgIC5hdHRyKFwieFwiLCB4cm93KS5hdHRyKFwieVwiLCB5Y2VudGVyKVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dChyb3dsYWJlbClcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSg5MCBcIiArIHhyb3cgKyBcIiBcIiArIHljZW50ZXIgKyBcIilcIik7XHJcbiAgICB9XHJcbiAgICBpZiAoYXhlcy5jb2x1bW4udmFyaWFibGUoKSkge1xyXG4gICAgICB2YXIgdnNjaGVtYWNvbHVtbiA9IHZhcmlhYmxlX3NjaGVtYShheGVzLmNvbHVtbi52YXJpYWJsZSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcbiAgICAgIHZhciBjb2x1bW5sYWJlbCA9IHZzY2hlbWFjb2x1bW4udGl0bGU7XHJcbiAgICAgIGcuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJsYWJlbCBsYWJlbC15XCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHhjZW50ZXIpLmF0dHIoXCJ5XCIsIHNldHRpbmdzKFwicGFkZGluZ1wiKVsyXSkuYXR0cihcImR5XCIsIFwiMC43MWVtXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS50ZXh0KGNvbHVtbmxhYmVsKTtcclxuICAgIH1cclxuICAgIC8vIGNyZWF0ZSBlYWNoIG9mIHRoZSBwYW5lbHNcclxuICAgIHZhciBkID0gZDMubmVzdCgpLmtleShuZXN0X2NvbHVtbikua2V5KG5lc3Rfcm93KS5lbnRyaWVzKGdyYXBoLmRhdGEoKSk7XHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgZC5sZW5ndGg7ICsraSkge1xyXG4gICAgICB2YXIgZGogPSBkW2ldLnZhbHVlcztcclxuICAgICAgdCAgPSBzZXR0aW5ncygncGFkZGluZycpWzJdICsgY29sdW1ubGFiZWxfaGVpZ2h0O1xyXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRqLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgICAgLy8gZHJhdyB4LWF4aXNcclxuICAgICAgICBpZiAoaiA9PSAoZGoubGVuZ3RoLTEpKSB7XHJcbiAgICAgICAgICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpcyBheGlzLXhcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyAodCArIGgpICsgXCIpXCIpLmNhbGwoYXhlcy54KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZHJhdyB5LWF4aXNcclxuICAgICAgICBpZiAoaSA9PT0gMCkge1xyXG4gICAgICAgICAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXMgYXhpcy15XCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgKGwgLSBheGVzLnkud2lkdGgoKSkgKyBcIixcIiArIHQgKyBcIilcIilcclxuICAgICAgICAgICAgLmNhbGwoYXhlcy55KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZHJhdyByb3cgbGFiZWxzXHJcbiAgICAgICAgaWYgKGkgPT0gKGQubGVuZ3RoLTEpICYmIGF4ZXMucm93LnZhcmlhYmxlKCkpIHtcclxuICAgICAgICAgIHZhciByb3d0aWNrID0gYXhlcy5yb3cudGlja3MoKVtqXTtcclxuICAgICAgICAgIHZhciBncm93ID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXMgYXhpcy1yb3dcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAobCArIHcpICsgXCIsXCIgKyB0ICsgXCIpXCIpO1xyXG4gICAgICAgICAgZ3Jvdy5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBsYWJlbF9oZWlnaHQgKyAyKnNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKVxyXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoKTtcclxuICAgICAgICAgIGdyb3cuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIDApLmF0dHIoXCJ5XCIsIGgvMilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoOTAgXCIgKyBcclxuICAgICAgICAgICAgICAobGFiZWxfaGVpZ2h0IC0gc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpICsgXCIgXCIgKyBoLzIgKyBcIilcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS5hdHRyKFwiZHlcIiwgXCIwLjM1ZW1cIilcclxuICAgICAgICAgICAgLnRleHQocm93dGljayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGRyYXcgY29sdW1uIGxhYmVsc1xyXG4gICAgICAgIGlmIChqID09PSAwICYmIGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkpIHtcclxuICAgICAgICAgIHZhciBjb2x1bW50aWNrID0gYXhlcy5jb2x1bW4udGlja3MoKVtpXTtcclxuICAgICAgICAgIHZhciBjb2x0aWNraCA9IGxhYmVsX2hlaWdodCArIDIqc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIik7XHJcbiAgICAgICAgICB2YXIgZ2NvbHVtbiA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzIGF4aXMtY29sdW1uXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbCArIFwiLFwiICsgKHQgLSBjb2x0aWNraCkgKyBcIilcIik7XHJcbiAgICAgICAgICBnY29sdW1uLmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGxhYmVsX2hlaWdodCArIDIqc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpO1xyXG4gICAgICAgICAgZ2NvbHVtbi5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tsYWJlbFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgdy8yKS5hdHRyKFwieVwiLCBzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS5hdHRyKFwiZHlcIiwgXCIwLjcxZW1cIilcclxuICAgICAgICAgICAgLnRleHQoY29sdW1udGljayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGRyYXcgYm94IGZvciBncmFwaFxyXG4gICAgICAgIHZhciBnciA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJwYW5lbFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyB0ICsgXCIpXCIpO1xyXG4gICAgICAgIGdyLmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3KS5hdHRyKFwiaGVpZ2h0XCIsIGgpO1xyXG4gICAgICAgIC8vIGRyYXcgZ3JpZFxyXG4gICAgICAgIHZhciB4dGlja3MgPSBheGVzLngudGlja3MoKTtcclxuICAgICAgICBnci5zZWxlY3RBbGwoXCJsaW5lLmdyaWR4XCIpLmRhdGEoeHRpY2tzKS5lbnRlcigpLmFwcGVuZChcImxpbmVcIilcclxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJncmlkIGdyaWR4XCIpXHJcbiAgICAgICAgICAuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZSkuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZSlcclxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcInkyXCIsIGgpO1xyXG4gICAgICAgIHZhciB5dGlja3MgPSBheGVzLnkudGlja3MoKTtcclxuICAgICAgICBnci5zZWxlY3RBbGwoXCJsaW5lLmdyaWR5XCIpLmRhdGEoeXRpY2tzKS5lbnRlcigpLmFwcGVuZChcImxpbmVcIilcclxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJncmlkIGdyaWR5XCIpXHJcbiAgICAgICAgICAuYXR0cihcIngxXCIsIDApLmF0dHIoXCJ4MlwiLCB3KVxyXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCBheGVzLnkuc2NhbGUpLmF0dHIoXCJ5MlwiLCBheGVzLnkuc2NhbGUpO1xyXG4gICAgICAgIC8vIGFkZCBjcm9zc2hhaXJzIHRvIGdyYXBoXHJcbiAgICAgICAgdmFyIGdjcm9zc2ggPSBnci5hcHBlbmQoXCJnXCIpLmNsYXNzZWQoXCJjcm9zc2hhaXJzXCIsIHRydWUpO1xyXG4gICAgICAgIGdjcm9zc2guYXBwZW5kKFwibGluZVwiKS5jbGFzc2VkKFwiaGxpbmVcIiwgdHJ1ZSkuYXR0cihcIngxXCIsIDApXHJcbiAgICAgICAgICAuYXR0cihcInkxXCIsIDApLmF0dHIoXCJ4MlwiLCBheGVzLngud2lkdGgoKSkuYXR0cihcInkyXCIsIDApXHJcbiAgICAgICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgIGdjcm9zc2guYXBwZW5kKFwibGluZVwiKS5jbGFzc2VkKFwidmxpbmVcIiwgdHJ1ZSkuYXR0cihcIngxXCIsIDApXHJcbiAgICAgICAgICAuYXR0cihcInkxXCIsIDApLmF0dHIoXCJ4MlwiLCAwKS5hdHRyKFwieTJcIiwgYXhlcy55LmhlaWdodCgpKVxyXG4gICAgICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICAgICAgICAvLyBkcmF3IHBhbmVsXHJcbiAgICAgICAgZ3JhcGhfcGFuZWwoZ3IsIGRqW2pdLnZhbHVlcyk7XHJcbiAgICAgICAgLy8gbmV4dCBwYW5lbFxyXG4gICAgICAgIHQgKz0gYXhlcy55LmhlaWdodCgpICsgc2V0dGluZ3MoJ3NlcCcpO1xyXG4gICAgICB9XHJcbiAgICAgIGwgKz0gYXhlcy54LndpZHRoKCkgKyBzZXR0aW5ncygnc2VwJyk7XHJcbiAgICB9XHJcbiAgICAvLyBmaW5pc2hlZCBkcmF3aW5nIGNhbGwgcmVhZHkgZXZlbnRcclxuICAgIGRpc3BhdGNoLnJlYWR5LmNhbGwoZyk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBncmFwaDtcclxufVxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9ncmFwaChheGVzLCBkaXNwYXRjaCwgZ3JhcGgpIHtcclxuXHJcbiAgdmFyIHdpZHRoLCBoZWlnaHQ7XHJcbiAgdmFyIGRhdGEsIHNjaGVtYTtcclxuXHJcbiAgZ3JhcGguYXhlcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGQzLmtleXMoYXhlcyk7XHJcbiAgfTtcclxuXHJcbiAgZ3JhcGgud2lkdGggPSBmdW5jdGlvbih3KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gd2lkdGg7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB3aWR0aCA9IHc7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGdyYXBoLmhlaWdodCA9IGZ1bmN0aW9uKGgpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBoZWlnaHQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoZWlnaHQgPSBoO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBncmFwaC5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZXMsIGF4aXMpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xyXG4gICAgICBpZiAoYXhlc1theGlzXSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgIHJldHVybiBheGVzW2F4aXNdLmFjY2VwdCh2YXJpYWJsZXMsIHNjaGVtYSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmb3IgKHZhciBpIGluIGF4ZXMpIHtcclxuICAgICAgICBpZiAodmFyaWFibGVzW2ldID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIGlmIChheGVzW2ldLnJlcXVpcmVkKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZhciBhY2NlcHQgPSBheGVzW2ldLmFjY2VwdCh2YXJpYWJsZXNbaV0sIHNjaGVtYSk7XHJcbiAgICAgICAgICBpZiAoIWFjY2VwdCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBncmFwaC5hc3NpZ24gPSBmdW5jdGlvbih2YXJpYWJsZXMpIHtcclxuICAgIGZvciAodmFyIGkgaW4gYXhlcykgYXhlc1tpXS52YXJpYWJsZSh2YXJpYWJsZXNbaV0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgZ3JhcGguc2NoZW1hID0gZnVuY3Rpb24ocykge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHNjaGVtYTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNjaGVtYSA9IHM7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGdyYXBoLmRhdGEgPSBmdW5jdGlvbihkLCBzKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gZGF0YTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRhdGEgPSBkO1xyXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIFxyXG4gICAgICAgIGdyYXBoLnNjaGVtYShzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZ3JhcGguZGlzcGF0Y2ggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBkaXNwYXRjaDtcclxuICB9O1xyXG5cclxuICByZXR1cm4gZ3JhcGg7XHJcbn1cclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2dyYXBoX2JhcigpIHtcclxuXHJcbiAgdmFyIGF4ZXMgPSB7XHJcbiAgICAneCcgOiBncnBoX2F4aXNfbGluZWFyKHRydWUpLm9yaWdpbigwKSxcclxuICAgICd5JyA6IGdycGhfYXhpc19jYXRlZ29yaWNhbCgpLFxyXG4gICAgJ2NvbG91cic6IGdycGhfYXhpc19jb2xvdXIoKSxcclxuICAgICdjb2x1bW4nIDogZ3JwaF9heGlzX3NwbGl0KCksXHJcbiAgICAncm93JyA6IGdycGhfYXhpc19zcGxpdCgpXHJcbiAgfTtcclxuICBheGVzLngucmVxdWlyZWQgPSB0cnVlO1xyXG4gIGF4ZXMueS5yZXF1aXJlZCA9IHRydWU7XHJcbiAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2goXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcImNsaWNrXCIsIFwicmVhZHlcIik7XHJcblxyXG4gIHZhciBncmFwaCA9IGdycGhfZ2VuZXJpY19ncmFwaChheGVzLCBkaXNwYXRjaCwgXCJiYXJcIiwgZnVuY3Rpb24oZywgZGF0YSkge1xyXG4gICAgZnVuY3Rpb24gbmVzdF9jb2xvdXIoZCkge1xyXG4gICAgICByZXR1cm4gYXhlcy5jb2xvdXIudmFyaWFibGUoKSA/IGRbYXhlcy5jb2xvdXIudmFyaWFibGUoKV0gOiAxO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZ2V0X3goZCkge1xyXG4gICAgICB2YXIgdiA9IGF4ZXMueC5zY2FsZShkKTtcclxuICAgICAgcmV0dXJuIHYgPCBheGVzLnguc2NhbGUob3JpZ2luKSA/IHYgOiBheGVzLnguc2NhbGUob3JpZ2luKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGdldF93aWR0aChkKSB7XHJcbiAgICAgIHJldHVybiBNYXRoLmFicyhheGVzLnguc2NhbGUoZCkgLSBheGVzLnguc2NhbGUob3JpZ2luKSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBnZXRfeShkKSB7XHJcbiAgICAgIHJldHVybiBheGVzLnkuc2NhbGUubChkKSArIGkqYXhlcy55LnNjYWxlLncoZCkvbmNvbG91cnM7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBnZXRfaGVpZ2h0KGQpIHtcclxuICAgICAgcmV0dXJuIGF4ZXMueS5zY2FsZS53KGQpL25jb2xvdXJzO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBkID0gZDMubmVzdCgpLmtleShuZXN0X2NvbG91cikuZW50cmllcyhkYXRhKTtcclxuICAgIHZhciBuY29sb3VycyA9IGQubGVuZ3RoO1xyXG4gICAgdmFyIG9yaWdpbiA9IGF4ZXMueC5vcmlnaW4oKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZC5sZW5ndGg7ICsraSkge1xyXG4gICAgICB2YXIgY29sb3VyID0gYXhlcy5jb2xvdXIuc2NhbGUoZFtpXS5rZXkpO1xyXG4gICAgICBnLnNlbGVjdEFsbChcInJlY3QuXCIgKyBjb2xvdXIpLmRhdGEoZFtpXS52YWx1ZXMpLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYXIgXCIgKyBjb2xvdXIpLmF0dHIoXCJ4XCIsIGdldF94KVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgZ2V0X3dpZHRoKS5hdHRyKFwieVwiLCBnZXRfeSkuYXR0cihcImhlaWdodFwiLCBnZXRfaGVpZ2h0KTtcclxuICAgIH1cclxuICAgIGcuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgXCJvcmlnaW5cIilcclxuICAgICAgLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUob3JpZ2luKSlcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUob3JpZ2luKSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieTJcIiwgYXhlcy55LmhlaWdodCgpKTtcclxuICB9KTtcclxuXHJcbiAgLy8gd2hlbiBmaW5pc2hlZCBkcmF3aW5nIGdyYXBoOyBhZGQgZXZlbnQgaGFuZGxlcnMgXHJcbiAgZGlzcGF0Y2gub24oXCJyZWFkeVwiLCBmdW5jdGlvbigpIHtcclxuICAgIC8vIGFkZCBob3ZlciBldmVudHMgdG8gdGhlIGxpbmVzIGFuZCBwb2ludHNcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XHJcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcclxuICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xyXG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xyXG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICAvLyBMb2NhbCBldmVudCBoYW5kbGVyc1xyXG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgaWYgKHZhcmlhYmxlKSB7XHJcbiAgICAgIHZhciBjbGFzc2VzID0gYXhlcy5jb2xvdXIuc2NhbGUoXCJcIiArIHZhbHVlKTtcclxuICAgICAgdmFyIHJlZ2V4cCA9IC9cXGJjb2xvdXIoWzAtOV0rKVxcYi87XHJcbiAgICAgIHZhciBjb2xvdXIgPSByZWdleHAuZXhlYyhjbGFzc2VzKVswXTtcclxuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLmNsYXNzZWQoXCJjb2xvdXJsb3dcIiwgdHJ1ZSk7XHJcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLlwiICsgY29sb3VyKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogdHJ1ZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcclxuICAgIH1cclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLmF0dHIoXCJ5MVwiLCBheGVzLnkuc2NhbGUoZCkpLmF0dHIoXCJ5MlwiLCBheGVzLnkuc2NhbGUoZCkpXHJcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZShkKSkuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZShkKSlcclxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XHJcbiAgfSk7XHJcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogZmFsc2UsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFRvb2x0aXBcclxuICAvLyB3aGVuIGQzLnRpcCBpcyBsb2FkZWRcclxuICBpZiAoZDMudGlwICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHZhciB0aXAgPSBkMy50aXAoKS5kaXJlY3Rpb24oXCJzZVwiKS5hdHRyKCdjbGFzcycsICd0aXAgdGlwLWJhcicpLmh0bWwoZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7IFxyXG4gICAgICB2YXIgc2NoZW1hID0gZ3JhcGguc2NoZW1hKCk7XHJcbiAgICAgIHZhciBmb3JtYXQgPSB2YWx1ZV9mb3JtYXR0ZXIoc2NoZW1hKTtcclxuICAgICAgdmFyIHN0ciA9ICcnO1xyXG4gICAgICBmb3IgKHZhciBpIGluIHNjaGVtYS5maWVsZHMpIHtcclxuICAgICAgICB2YXIgZmllbGQgPSBzY2hlbWEuZmllbGRzW2ldO1xyXG4gICAgICAgIHN0ciArPSBmaWVsZC50aXRsZSArICc6ICcgKyBmb3JtYXQoZCwgZmllbGQubmFtZSkgKyAnPC9icj4nO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwicmVhZHkudGlwXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNhbGwodGlwKTtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXIudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgICB0aXAuc2hvdyh2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0LnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgICAgdGlwLmhpZGUodmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGdyYXBoO1xyXG59XHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2dyYXBoX2J1YmJsZSgpIHtcclxuXHJcbiAgdmFyIGF4ZXMgPSB7XHJcbiAgICAneCcgOiBncnBoX2F4aXNfbGluZWFyKHRydWUpLFxyXG4gICAgJ3knIDogZ3JwaF9heGlzX2xpbmVhcihmYWxzZSksXHJcbiAgICAnb2JqZWN0JyA6IGdycGhfYXhpc19jb2xvdXIoKSxcclxuICAgICdzaXplJyAgIDogZ3JwaF9heGlzX3NpemUoKSxcclxuICAgICdjb2xvdXInIDogZ3JwaF9heGlzX2NvbG91cigpLFxyXG4gICAgJ2NvbHVtbicgOiBncnBoX2F4aXNfc3BsaXQoKSxcclxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcclxuICB9O1xyXG4gIGF4ZXMueC5yZXF1aXJlZCA9IHRydWU7XHJcbiAgYXhlcy55LnJlcXVpcmVkID0gdHJ1ZTtcclxuICBheGVzLm9iamVjdC5yZXF1aXJlZCA9IHRydWU7XHJcbiAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2goXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcImNsaWNrXCIsIFwicmVhZHlcIik7XHJcblxyXG4gIHZhciBncmFwaCA9IGdycGhfZ2VuZXJpY19ncmFwaChheGVzLCBkaXNwYXRjaCwgXCJidWJibGVcIiwgZnVuY3Rpb24oZywgZGF0YSkge1xyXG4gICAgZnVuY3Rpb24gbmVzdF9vYmplY3QoZCkge1xyXG4gICAgICByZXR1cm4gYXhlcy5vYmplY3QudmFyaWFibGUoKSA/IGRbYXhlcy5vYmplY3QudmFyaWFibGUoKV0gOiAxO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbmVzdF9jb2xvdXIoZCkge1xyXG4gICAgICByZXR1cm4gYXhlcy5jb2xvdXIudmFyaWFibGUoKSA/IGRbYXhlcy5jb2xvdXIudmFyaWFibGUoKV0gOiAxO1xyXG4gICAgfVxyXG4gICAgdmFyIGQgPSBkMy5uZXN0KCkua2V5KG5lc3RfY29sb3VyKS5lbnRyaWVzKGRhdGEpO1xyXG4gICAgLy8gZHJhdyBidWJibGVzIFxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIGcuc2VsZWN0QWxsKFwiY2lyY2xlLmJ1YmJsZVwiICsgaSkuZGF0YShkW2ldLnZhbHVlcykuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYnViYmxlIGJ1YmJsZVwiICsgaSArIFwiIFwiICsgYXhlcy5jb2xvdXIuc2NhbGUoZFtpXS5rZXkpKVxyXG4gICAgICAgIC5hdHRyKFwiY3hcIiwgYXhlcy54LnNjYWxlKS5hdHRyKFwiY3lcIiwgYXhlcy55LnNjYWxlKVxyXG4gICAgICAgIC5hdHRyKFwiclwiLCBheGVzLnNpemUuc2NhbGUpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgLy8gd2hlbiBmaW5pc2hlZCBkcmF3aW5nIGdyYXBoOyBhZGQgZXZlbnQgaGFuZGxlcnMgXHJcbiAgZGlzcGF0Y2gub24oXCJyZWFkeVwiLCBmdW5jdGlvbigpIHtcclxuICAgIC8vIGFkZCBob3ZlciBldmVudHMgdG8gdGhlIGxpbmVzIGFuZCBwb2ludHNcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XHJcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcclxuICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xyXG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xyXG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICAvLyBMb2NhbCBldmVudCBoYW5kbGVyc1xyXG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgaWYgKHZhcmlhYmxlKSB7XHJcbiAgICAgIHZhciBjbGFzc2VzID0gYXhlcy5jb2xvdXIuc2NhbGUoXCJcIiArIHZhbHVlKTtcclxuICAgICAgdmFyIHJlZ2V4cCA9IC9cXGJjb2xvdXIoWzAtOV0rKVxcYi87XHJcbiAgICAgIHZhciBjb2xvdXIgPSByZWdleHAuZXhlYyhjbGFzc2VzKVswXTtcclxuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLmNsYXNzZWQoXCJjb2xvdXJsb3dcIiwgdHJ1ZSk7XHJcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLlwiICsgY29sb3VyKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogdHJ1ZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcclxuICAgIH1cclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLmF0dHIoXCJ5MVwiLCBheGVzLnkuc2NhbGUoZCkpLmF0dHIoXCJ5MlwiLCBheGVzLnkuc2NhbGUoZCkpXHJcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZShkKSkuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZShkKSlcclxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XHJcbiAgfSk7XHJcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogZmFsc2UsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFRvb2x0aXBcclxuICAvLyB3aGVuIGQzLnRpcCBpcyBsb2FkZWRcclxuICBpZiAoZDMudGlwICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHZhciB0aXAgPSBkMy50aXAoKS5kaXJlY3Rpb24oXCJzZVwiKS5hdHRyKCdjbGFzcycsICd0aXAgdGlwLWJ1YmJsZScpLmh0bWwoZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7IFxyXG4gICAgICB2YXIgc2NoZW1hID0gZ3JhcGguc2NoZW1hKCk7XHJcbiAgICAgIHZhciBmb3JtYXQgPSB2YWx1ZV9mb3JtYXR0ZXIoc2NoZW1hKTtcclxuICAgICAgdmFyIHN0ciA9ICcnO1xyXG4gICAgICBmb3IgKHZhciBpIGluIHNjaGVtYS5maWVsZHMpIHtcclxuICAgICAgICB2YXIgZmllbGQgPSBzY2hlbWEuZmllbGRzW2ldO1xyXG4gICAgICAgIHN0ciArPSBmaWVsZC50aXRsZSArICc6ICcgKyBmb3JtYXQoZCwgZmllbGQubmFtZSkgKyAnPC9icj4nO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwicmVhZHkudGlwXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNhbGwodGlwKTtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXIudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgICB0aXAuc2hvdyh2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0LnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgICAgdGlwLmhpZGUodmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcblxyXG4gIHJldHVybiBncmFwaDtcclxufVxyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfZ3JhcGhfbGluZSgpIHtcclxuXHJcbiAgdmFyIGF4ZXMgPSB7XHJcbiAgICAneCcgOiBncnBoX2F4aXNfc3dpdGNoKFtncnBoX2F4aXNfbGluZWFyKHRydWUpLCBncnBoX2F4aXNfcGVyaW9kKCldKSxcclxuICAgICd5JyA6IGdycGhfYXhpc19saW5lYXIoZmFsc2UpLFxyXG4gICAgJ2NvbG91cicgOiBncnBoX2F4aXNfY29sb3VyKCksXHJcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxyXG4gICAgJ3JvdycgOiBncnBoX2F4aXNfc3BsaXQoKVxyXG4gIH07XHJcbiAgYXhlcy54LnJlcXVpcmVkID0gdHJ1ZTtcclxuICBheGVzLnkucmVxdWlyZWQgPSB0cnVlO1xyXG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJwb2ludG92ZXJcIiwgXCJwb2ludG91dFwiLFxyXG4gICAgXCJjbGlja1wiLCBcInJlYWR5XCIpO1xyXG5cclxuICB2YXIgZ3JhcGggPSBncnBoX2dlbmVyaWNfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIFwibGluZVwiLCBmdW5jdGlvbihnLCBkYXRhKSB7XHJcbiAgICBmdW5jdGlvbiBuZXN0X2NvbG91cihkKSB7XHJcbiAgICAgIHJldHVybiBheGVzLmNvbG91ci52YXJpYWJsZSgpID8gZFtheGVzLmNvbG91ci52YXJpYWJsZSgpXSA6IDE7XHJcbiAgICB9XHJcbiAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2xvdXIpLmVudHJpZXMoZGF0YSk7XHJcbiAgICAvLyBkcmF3IGxpbmVzIFxyXG4gICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpLngoYXhlcy54LnNjYWxlKS55KGF4ZXMueS5zY2FsZSk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcclxuICAgICAgZy5hcHBlbmQoXCJwYXRoXCIpLmF0dHIoXCJkXCIsIGxpbmUoZFtpXS52YWx1ZXMpKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgYXhlcy5jb2xvdXIuc2NhbGUoZFtpXS5rZXkpKVxyXG4gICAgICAgIC5kYXR1bShkW2ldKTtcclxuICAgIH1cclxuICAgIC8vIGRyYXcgcG9pbnRzIFxyXG4gICAgZm9yIChpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcclxuICAgICAgdmFyIGNscyA9IFwiY2lyY2xlXCIgKyBpO1xyXG4gICAgICBnLnNlbGVjdEFsbChcImNpcmNsZS5jaXJjbGVcIiArIGkpLmRhdGEoZFtpXS52YWx1ZXMpLmVudGVyKCkuYXBwZW5kKFwiY2lyY2xlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImNpcmNsZVwiICsgaSArIFwiIFwiICsgYXhlcy5jb2xvdXIuc2NhbGUoZFtpXS5rZXkpKVxyXG4gICAgICAgIC5hdHRyKFwiY3hcIiwgYXhlcy54LnNjYWxlKS5hdHRyKFwiY3lcIiwgYXhlcy55LnNjYWxlKVxyXG4gICAgICAgIC5hdHRyKFwiclwiLCBzZXR0aW5ncygncG9pbnRfc2l6ZScpKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gd2hlbiBmaW5pc2hlZCBkcmF3aW5nIGdyYXBoOyBhZGQgZXZlbnQgaGFuZGxlcnMgXHJcbiAgZGlzcGF0Y2gub24oXCJyZWFkeVwiLCBmdW5jdGlvbigpIHtcclxuICAgIC8vIGFkZCBob3ZlciBldmVudHMgdG8gdGhlIGxpbmVzIGFuZCBwb2ludHNcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XHJcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcclxuICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgICAgaWYgKCFkLmtleSkgZGlzcGF0Y2gucG9pbnRvdmVyLmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xyXG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgICAgaWYgKCFkLmtleSkgZGlzcGF0Y2gucG9pbnRvdXQuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSkub24oXCJjbGlja1wiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XHJcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcclxuICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcclxuICAvLyBIaWdobGlnaHRpbmcgb2Ygc2VsZWN0ZWQgbGluZVxyXG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgaWYgKHZhcmlhYmxlKSB7XHJcbiAgICAgIHZhciBjbGFzc2VzID0gYXhlcy5jb2xvdXIuc2NhbGUoXCJcIiArIHZhbHVlKTtcclxuICAgICAgdmFyIHJlZ2V4cCA9IC9cXGJjb2xvdXIoWzAtOV0rKVxcYi87XHJcbiAgICAgIHZhciBjb2xvdXIgPSByZWdleHAuZXhlYyhjbGFzc2VzKVswXTtcclxuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLmNsYXNzZWQoXCJjb2xvdXJsb3dcIiwgdHJ1ZSk7XHJcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLlwiICsgY29sb3VyKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogdHJ1ZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcclxuICAgIH1cclxuICB9KTtcclxuICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiBmYWxzZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcclxuICB9KTtcclxuICAvLyBTaG93IGNyb3NzaGFpcnMgd2hlbiBob3ZlcmluZyBvdmVyIGEgcG9pbnRcclxuICBkaXNwYXRjaC5vbihcInBvaW50b3ZlclwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLmF0dHIoXCJ5MVwiLCBheGVzLnkuc2NhbGUoZCkpLmF0dHIoXCJ5MlwiLCBheGVzLnkuc2NhbGUoZCkpXHJcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZShkKSkuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZShkKSlcclxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XHJcbiAgfSk7XHJcbiAgZGlzcGF0Y2gub24oXCJwb2ludG91dFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICB9KTtcclxuXHJcbiAgLy8gVG9vbHRpcFxyXG4gIC8vIHdoZW4gZDMudGlwIGlzIGxvYWRlZFxyXG4gIGlmIChkMy50aXAgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgdmFyIHRpcCA9IGQzLnRpcCgpLmRpcmVjdGlvbihcInNlXCIpLmF0dHIoJ2NsYXNzJywgJ3RpcCB0aXAtbGluZScpLmh0bWwoZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7IFxyXG4gICAgICB2YXIgc2NoZW1hID0gZ3JhcGguc2NoZW1hKCk7XHJcbiAgICAgIHZhciBmb3JtYXQgPSB2YWx1ZV9mb3JtYXR0ZXIoc2NoZW1hKTtcclxuICAgICAgdmFyIHN0ciA9ICcnO1xyXG4gICAgICBmb3IgKHZhciBpIGluIHNjaGVtYS5maWVsZHMpIHtcclxuICAgICAgICB2YXIgZmllbGQgPSBzY2hlbWEuZmllbGRzW2ldO1xyXG4gICAgICAgIHN0ciArPSBmaWVsZC50aXRsZSArICc6ICcgKyBmb3JtYXQoZCxmaWVsZC5uYW1lKSArICc8L2JyPic7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJyZWFkeS50aXBcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuY2FsbCh0aXApO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcInBvaW50b3Zlci50aXBcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICAgIHRpcC5zaG93KHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwicG9pbnRvdXQudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgICB0aXAuaGlkZSh2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZ3JhcGg7XHJcbn1cclxuXHJcbiIsIlxyXG5cclxuZnVuY3Rpb24gZ3JwaF9ncmFwaF9tYXAoKSB7XHJcblxyXG4gIHZhciBheGVzID0ge1xyXG4gICAgJ3JlZ2lvbicgOiBncnBoX2F4aXNfcmVnaW9uKCksXHJcbiAgICAnY29sb3VyJyA6IGdycGhfYXhpc19jaGxvcm9wbGV0aCgpLFxyXG4gICAgJ2NvbHVtbicgOiBncnBoX2F4aXNfc3BsaXQoKSxcclxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcclxuICB9O1xyXG4gIGF4ZXMucmVnaW9uLnJlcXVpcmVkID0gdHJ1ZTtcclxuICBheGVzLmNvbG91ci5yZXF1aXJlZCA9IHRydWU7XHJcbiAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2goXCJyZWFkeVwiLCBcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIsIFwiY2xpY2tcIik7XHJcblxyXG4gIHZhciBkdW1teV8gPSBkMy5zZWxlY3QoXCJib2R5XCIpLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcImR1bW15IGdyYXBoIGdyYXBoLW1hcFwiKVxyXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCAwKS5hdHRyKFwiaGVpZ2h0XCIsIDApXHJcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gIHZhciBsYWJlbF9zaXplXyA9IGdycGhfbGFiZWxfc2l6ZShkdW1teV8pO1xyXG5cclxuXHJcbiAgdmFyIGdyYXBoID0gZ3JwaF9ncmFwaChheGVzLCBkaXNwYXRjaCwgZnVuY3Rpb24oZykge1xyXG4gICAgZnVuY3Rpb24gbmVzdF9jb2x1bW4oZCkge1xyXG4gICAgICByZXR1cm4gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGRbYXhlcy5jb2x1bW4udmFyaWFibGUoKV0gOiAxO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbmVzdF9yb3coZCkge1xyXG4gICAgICByZXR1cm4gYXhlcy5yb3cudmFyaWFibGUoKSA/IGRbYXhlcy5yb3cudmFyaWFibGUoKV0gOiAxO1xyXG4gICAgfVxyXG4gICAgLy8gc2V0dXAgYXhlc1xyXG4gICAgYXhlcy5yZWdpb24uZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG4gICAgYXhlcy5jb2xvdXIuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG4gICAgYXhlcy5jb2x1bW4uZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG4gICAgYXhlcy5yb3cuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG5cclxuICAgIC8vIGRldGVybWluZSBudW1iZXIgb2Ygcm93cyBhbmQgY29sdW1uc1xyXG4gICAgdmFyIG5jb2wgPSBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gYXhlcy5jb2x1bW4udGlja3MoKS5sZW5ndGggOiAxO1xyXG4gICAgdmFyIG5yb3cgPSBheGVzLnJvdy52YXJpYWJsZSgpID8gYXhlcy5yb3cudGlja3MoKS5sZW5ndGggOiAxO1xyXG4gICAgLy8gc2V0IHRoZSB3aWR0aCwgaGVpZ2h0IGVuZCBkb21haW4gb2YgdGhlIHgtIGFuZCB5LWF4ZXNcclxuICAgIHZhciBsYWJlbF9oZWlnaHQgPSBsYWJlbF9zaXplXy5oZWlnaHQoXCJ2YXJpYWJsZVwiKSArIHNldHRpbmdzKCdsYWJlbF9wYWRkaW5nJyk7XHJcbiAgICB2YXIgcm93bGFiZWxfd2lkdGggPSBheGVzLnJvdy52YXJpYWJsZSgpID8gMypsYWJlbF9oZWlnaHQgOiAwO1xyXG4gICAgdmFyIGNvbHVtbmxhYmVsX2hlaWdodCA9IGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyAzKmxhYmVsX2hlaWdodCA6IDA7XHJcbiAgICB2YXIgdyA9IChncmFwaC53aWR0aCgpIC0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzFdIC0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzNdIC0gXHJcbiAgICAgIHJvd2xhYmVsX3dpZHRoIC0gKG5jb2wtMSkqc2V0dGluZ3MoXCJzZXBcIiwgXCJtYXBcIikpL25jb2w7XHJcbiAgICB2YXIgaCA9IChncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVswXSAtIHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVsyXSAtIFxyXG4gICAgICBjb2x1bW5sYWJlbF9oZWlnaHQgLSAobnJvdy0xKSpzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKSkvbnJvdztcclxuICAgIHZhciBsID0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzFdO1xyXG4gICAgdmFyIHQgID0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzJdO1xyXG4gICAgYXhlcy5yZWdpb24ud2lkdGgodykuaGVpZ2h0KGgpO1xyXG4gICAgLy8gY3JlYXRlIGdyb3VwIGNvbnRhaW5pbmcgY29tcGxldGUgZ3JhcGhcclxuICAgIGcgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiZ3JhcGggZ3JhcGgtbWFwXCIpO1xyXG4gICAgLy8gZHJhdyBsYWJlbHNcclxuICAgIHZhciB5Y2VudGVyID0gdCArIDAuNSooZ3JhcGguaGVpZ2h0KCkgLSBzZXR0aW5ncygncGFkZGluZycpWzBdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXSAtIFxyXG4gICAgICAgIGxhYmVsX2hlaWdodCAtIGNvbHVtbmxhYmVsX2hlaWdodCkgKyBjb2x1bW5sYWJlbF9oZWlnaHQ7XHJcbiAgICB2YXIgeGNlbnRlciA9IGwgKyAwLjUqKGdyYXBoLndpZHRoKCkgLSBzZXR0aW5ncygncGFkZGluZycpWzFdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVszXSAtIFxyXG4gICAgICAgIGxhYmVsX2hlaWdodCAtIHJvd2xhYmVsX3dpZHRoKTtcclxuICAgIGlmIChheGVzLnJvdy52YXJpYWJsZSgpKSB7XHJcbiAgICAgIHZhciB4cm93ID0gZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbM10gLSBsYWJlbF9oZWlnaHQ7XHJcbiAgICAgIHZhciB2c2NoZW1hcm93ID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMucm93LnZhcmlhYmxlKCksIHNjaGVtYSk7XHJcbiAgICAgIHZhciByb3dsYWJlbCA9IHZzY2hlbWFyb3cudGl0bGU7XHJcbiAgICAgIGcuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJsYWJlbCBsYWJlbC15XCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHhyb3cpLmF0dHIoXCJ5XCIsIHljZW50ZXIpXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS50ZXh0KHJvd2xhYmVsKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDkwIFwiICsgeHJvdyArIFwiIFwiICsgeWNlbnRlciArIFwiKVwiKTtcclxuICAgIH1cclxuICAgIGlmIChheGVzLmNvbHVtbi52YXJpYWJsZSgpKSB7XHJcbiAgICAgIHZhciB2c2NoZW1hY29sdW1uID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMuY29sdW1uLnZhcmlhYmxlKCksIHNjaGVtYSk7XHJcbiAgICAgIHZhciBjb2x1bW5sYWJlbCA9IHZzY2hlbWFjb2x1bW4udGl0bGU7XHJcbiAgICAgIGcuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJsYWJlbCBsYWJlbC15XCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHhjZW50ZXIpLmF0dHIoXCJ5XCIsIHNldHRpbmdzKFwicGFkZGluZ1wiKVsyXSkuYXR0cihcImR5XCIsIFwiMC43MWVtXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS50ZXh0KGNvbHVtbmxhYmVsKTtcclxuICAgIH1cclxuICAgIC8vIGRyYXcgZ3JhcGhzXHJcbiAgICB3YWl0X2ZvcihheGVzLnJlZ2lvbi5tYXBfbG9hZGVkLCBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGQgPSBkMy5uZXN0KCkua2V5KG5lc3RfY29sdW1uKS5rZXkobmVzdF9yb3cpLmVudHJpZXMoZ3JhcGguZGF0YSgpKTtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgdmFyIGRqID0gZFtpXS52YWx1ZXM7XHJcbiAgICAgICAgdmFyIHQgID0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzJdICsgY29sdW1ubGFiZWxfaGVpZ2h0O1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGoubGVuZ3RoOyArK2opIHtcclxuICAgICAgICAgIC8vIGRyYXcgcm93IGxhYmVsc1xyXG4gICAgICAgICAgaWYgKGkgPT0gKGQubGVuZ3RoLTEpICYmIGF4ZXMucm93LnZhcmlhYmxlKCkpIHtcclxuICAgICAgICAgICAgdmFyIHJvd3RpY2sgPSBheGVzLnJvdy50aWNrcygpW2pdO1xyXG4gICAgICAgICAgICB2YXIgZ3JvdyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzIGF4aXMtcm93XCIpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAobCArIHcpICsgXCIsXCIgKyB0ICsgXCIpXCIpO1xyXG4gICAgICAgICAgICBncm93LmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgbGFiZWxfaGVpZ2h0ICsgMipzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKSlcclxuICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoKTtcclxuICAgICAgICAgICAgZ3Jvdy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tsYWJlbFwiKVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAwKS5hdHRyKFwieVwiLCBoLzIpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoOTAgXCIgKyBcclxuICAgICAgICAgICAgICAgIChsYWJlbF9oZWlnaHQgLSBzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKSkgKyBcIiBcIiArIGgvMiArIFwiKVwiKVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikuYXR0cihcImR5XCIsIFwiMC4zNWVtXCIpXHJcbiAgICAgICAgICAgICAgLnRleHQocm93dGljayk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBkcmF3IGNvbHVtbiBsYWJlbHNcclxuICAgICAgICAgIGlmIChqID09PSAwICYmIGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkpIHtcclxuICAgICAgICAgICAgdmFyIGNvbHVtbnRpY2sgPSBheGVzLmNvbHVtbi50aWNrcygpW2ldO1xyXG4gICAgICAgICAgICB2YXIgY29sdGlja2ggPSBsYWJlbF9oZWlnaHQgKyAyKnNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpO1xyXG4gICAgICAgICAgICB2YXIgZ2NvbHVtbiA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzIGF4aXMtY29sdW1uXCIpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyAodCAtIGNvbHRpY2toKSArIFwiKVwiKTtcclxuICAgICAgICAgICAgZ2NvbHVtbi5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgbGFiZWxfaGVpZ2h0ICsgMipzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKSk7XHJcbiAgICAgICAgICAgIGdjb2x1bW4uYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcclxuICAgICAgICAgICAgICAuYXR0cihcInhcIiwgdy8yKS5hdHRyKFwieVwiLCBzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKSlcclxuICAgICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLmF0dHIoXCJkeVwiLCBcIjAuNzFlbVwiKVxyXG4gICAgICAgICAgICAgIC50ZXh0KGNvbHVtbnRpY2spO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gZHJhdyBib3ggZm9yIGdyYXBoXHJcbiAgICAgICAgICB2YXIgZ3IgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwibWFwXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbCArIFwiLFwiICsgdCArIFwiKVwiKTtcclxuICAgICAgICAgIGdyLmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpLmF0dHIoXCJoZWlnaHRcIiwgaCk7XHJcbiAgICAgICAgICAvLyBkcmF3IG1hcFxyXG4gICAgICAgICAgZ3Iuc2VsZWN0QWxsKFwicGF0aFwiKS5kYXRhKGRqW2pdLnZhbHVlcykuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBheGVzLnJlZ2lvbi5zY2FsZSkuYXR0cihcImNsYXNzXCIsIGF4ZXMuY29sb3VyLnNjYWxlKTtcclxuICAgICAgICAgIC8vIG5leHQgbGluZVxyXG4gICAgICAgICAgdCArPSBoICsgc2V0dGluZ3MoXCJzZXBcIiwgXCJtYXBcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGwgKz0gdyArIHNldHRpbmdzKFwic2VwXCIsIFwibWFwXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIGFkZCBldmVudHMgdG8gdGhlIGxpbmVzXHJcbiAgICAgIGcuc2VsZWN0QWxsKFwicGF0aFwiKS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgdmFyIHJlZ2lvbiA9IGRbYXhlcy5yZWdpb24udmFyaWFibGUoKV07XHJcbiAgICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwoZywgYXhlcy5yZWdpb24udmFyaWFibGUoKSwgcmVnaW9uLCBkKTtcclxuICAgICAgfSkub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgdmFyIHJlZ2lvbiA9IGRbYXhlcy5yZWdpb24udmFyaWFibGUoKV07XHJcbiAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbChnLCBheGVzLnJlZ2lvbi52YXJpYWJsZSgpLCByZWdpb24sIGQpO1xyXG4gICAgICB9KS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgICB2YXIgcmVnaW9uID0gZFtheGVzLnJlZ2lvbi52YXJpYWJsZSgpXTtcclxuICAgICAgICBkaXNwYXRjaC5jbGljay5jYWxsKGcsIGF4ZXMucmVnaW9uLnZhcmlhYmxlKCksIHJlZ2lvbiwgZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBmaW5pc2hlZCBkcmF3aW5nIGNhbGwgcmVhZHkgZXZlbnRcclxuICAgICAgZGlzcGF0Y2gucmVhZHkuY2FsbChnKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuXHJcbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcclxuICBkaXNwYXRjaC5vbihcIm1vdXNlb3Zlci5ncmFwaFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwicGF0aFwiKS5jbGFzc2VkKFwiY29sb3VybG93XCIsIHRydWUpO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCJwYXRoXCIpLmZpbHRlcihmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgIHJldHVybiBkW3ZhcmlhYmxlXSA9PSB2YWx1ZTtcclxuICAgIH0pLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiB0cnVlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xyXG4gIH0pO1xyXG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdXQuZ3JhcGhcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcInBhdGhcIikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IGZhbHNlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xyXG4gIH0pO1xyXG4gIFxyXG4gIC8vIHRvb2x0aXBcclxuICBpZiAoZDMudGlwICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHZhciB0aXAgPSBkMy50aXAoKS5kaXJlY3Rpb24oXCJzZVwiKS5hdHRyKCdjbGFzcycsICd0aXAgdGlwLW1hcCcpLmh0bWwoZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7IFxyXG4gICAgICB2YXIgc2NoZW1hID0gZ3JhcGguc2NoZW1hKCk7XHJcbiAgICAgIHZhciBmb3JtYXQgPSB2YWx1ZV9mb3JtYXR0ZXIoc2NoZW1hKTtcclxuICAgICAgdmFyIHN0ciA9ICcnO1xyXG4gICAgICBmb3IgKHZhciBpIGluIHNjaGVtYS5maWVsZHMpIHtcclxuICAgICAgICB2YXIgZmllbGQgPSBzY2hlbWEuZmllbGRzW2ldO1xyXG4gICAgICAgIHN0ciArPSBmaWVsZC50aXRsZSArICc6ICcgKyBmb3JtYXQoZCwgZmllbGQubmFtZSkgKyAnPC9icj4nO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwicmVhZHkudGlwXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNhbGwodGlwKTtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXIudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgICB0aXAuc2hvdyh2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0LnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgICAgdGlwLmhpZGUodmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGdyYXBoO1xyXG59XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9sYWJlbF9zaXplKGcpIHtcclxuXHJcbiAgLy8gYSBzdmcgb3IgZyBlbGVtZW50IHRvIHdoaWNoICB3ZSB3aWxsIGJlIGFkZGluZyBvdXIgbGFiZWwgaW4gb3JkZXIgdG9cclxuICAvLyByZXF1ZXN0IGl0J3Mgc2l6ZVxyXG4gIHZhciBnXyA9IGc7XHJcbiAgLy8gc3RvcmUgcHJldmlvdXNseSBjYWxjdWxhdGVkIHZhbHVlczsgYXMgdGhlIHNpemUgb2YgY2VydGFpbiBsYWJlbHMgYXJlIFxyXG4gIC8vIHJlcXVlc3RlZCBhZ2FpbiBhbmQgYWdhaW4gdGhpcyBncmVhdGx5IGVuaGFuY2VzIHBlcmZvcm1hbmNlXHJcbiAgdmFyIHNpemVzXyA9IHt9O1xyXG5cclxuICBmdW5jdGlvbiBsYWJlbF9zaXplKGxhYmVsKSB7XHJcbiAgICBpZiAoc2l6ZXNfW2xhYmVsXSkge1xyXG4gICAgICByZXR1cm4gc2l6ZXNfW2xhYmVsXTtcclxuICAgIH1cclxuICAgIGlmICghZ18pIHJldHVybiBbdW5kZWZpbmVkLCB1bmRlZmluZWRdO1xyXG4gICAgdmFyIHRleHQgPSBnXy5hcHBlbmQoXCJ0ZXh0XCIpLnRleHQobGFiZWwpO1xyXG4gICAgdmFyIGJib3ggPSB0ZXh0WzBdWzBdLmdldEJCb3goKTtcclxuICAgIHZhciBzaXplID0gW2Jib3gud2lkdGgqMS4yLCBiYm94LmhlaWdodCowLjY1XTsgLy8gVE9ETyB3aHk7IGFuZCBpcyB0aGlzIGFsd2F5cyBjb3JyZWN0XHJcbiAgICAvL3ZhciBzaXplID0gaG9yaXpvbnRhbF8gPyB0ZXh0WzBdWzBdLmdldENvbXB1dGVkVGV4dExlbmd0aCgpIDpcclxuICAgICAgLy90ZXh0WzBdWzBdLmdldEJCb3goKS5oZWlnaHQ7XHJcbiAgICB0ZXh0LnJlbW92ZSgpO1xyXG4gICAgc2l6ZXNfW2xhYmVsXSA9IHNpemU7XHJcbiAgICByZXR1cm4gc2l6ZTtcclxuICB9XHJcblxyXG4gIGxhYmVsX3NpemUuc3ZnID0gZnVuY3Rpb24oZykge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGdfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZ18gPSBnO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBsYWJlbF9zaXplLndpZHRoID0gZnVuY3Rpb24obGFiZWwpIHtcclxuICAgIHZhciBzaXplID0gbGFiZWxfc2l6ZShsYWJlbCk7XHJcbiAgICByZXR1cm4gc2l6ZVswXTtcclxuICB9O1xyXG5cclxuICBsYWJlbF9zaXplLmhlaWdodCA9IGZ1bmN0aW9uKGxhYmVsKSB7XHJcbiAgICB2YXIgc2l6ZSA9IGxhYmVsX3NpemUobGFiZWwpO1xyXG4gICAgcmV0dXJuIHNpemVbMV07XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGxhYmVsX3NpemU7XHJcbn1cclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX3NjYWxlX2NhdGVnb3JpY2FsKCkge1xyXG5cclxuICB2YXIgZG9tYWluO1xyXG4gIHZhciByYW5nZSA9IFswLCAxXTtcclxuXHJcbiAgZnVuY3Rpb24gc2NhbGUodikge1xyXG4gICAgdmFyIGkgPSBkb21haW4uaW5kZXhPZih2KTtcclxuICAgIGlmIChpIDwgMCkgcmV0dXJuIHtsOiB1bmRlZmluZWQsIG06dW5kZWZpbmVkLCB1OnVuZGVmaW5lZH07XHJcbiAgICB2YXIgYncgPSAocmFuZ2VbMV0gLSByYW5nZVswXSkgLyBkb21haW4ubGVuZ3RoO1xyXG4gICAgdmFyIG0gPSBidyooaSArIDAuNSk7XHJcbiAgICB2YXIgdyA9IGJ3KigxIC0gc2V0dGluZ3MoXCJiYXJfcGFkZGluZ1wiKSkqMC41O1xyXG4gICAgcmV0dXJuIHtsOm0tdywgbTptLCB1Om0rd307XHJcbiAgfVxyXG5cclxuICBzY2FsZS5sID0gZnVuY3Rpb24odikge1xyXG4gICAgcmV0dXJuIHNjYWxlKHYpLmw7XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUubSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIHJldHVybiBzY2FsZSh2KS5tO1xyXG4gIH07XHJcblxyXG4gIHNjYWxlLnUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICByZXR1cm4gc2NhbGUodikudTtcclxuICB9O1xyXG5cclxuICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbihkKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gZG9tYWluO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZG9tYWluID0gZDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUucmFuZ2UgPSBmdW5jdGlvbihyKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gcmFuZ2U7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByYW5nZSA9IHI7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gZG9tYWluO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBzY2FsZTtcclxufVxyXG5cclxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xyXG5ncnBoLnNjYWxlLmNhdGVnb3JpY2FsID0gZ3JwaF9zY2FsZV9jYXRlZ29yaWNhbDtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX3NjYWxlX2NobG9yb3BsZXRoKCkge1xyXG5cclxuICB2YXIgZG9tYWluO1xyXG4gIHZhciBiYXNlY2xhc3MgPSBcImNobG9yb1wiO1xyXG4gIHZhciBuY29sb3VycyAgPSA5O1xyXG5cclxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XHJcbiAgICBpZiAoZG9tYWluID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gYXNzdW1lIHdlIGhhdmUgb25seSAxIGNvbG91clxyXG4gICAgICByZXR1cm4gYmFzZWNsYXNzICsgXCIgXCIgKyBiYXNlY2xhc3MgKyBcIm4xXCIgKyBcIiBcIiArIGJhc2VjbGFzcyArIDE7XHJcbiAgICB9XHJcbiAgICB2YXIgcmFuZ2UgID0gZG9tYWluWzFdIC0gZG9tYWluWzBdO1xyXG4gICAgdmFyIHZhbCAgICA9IE1hdGguc3FydCgodiAtIGRvbWFpblswXSkqMC45OTk5KSAvIE1hdGguc3FydChyYW5nZSk7XHJcbiAgICB2YXIgY2F0ICAgID0gTWF0aC5mbG9vcih2YWwqbmNvbG91cnMpO1xyXG4gICAgLy8gcmV0dXJucyBzb21ldGhpbmcgbGlrZSBcImNobG9ybyBjaGxvcm9uMTAgY2hsb3JvNFwiXHJcbiAgICByZXR1cm4gYmFzZWNsYXNzICsgXCIgXCIgKyBiYXNlY2xhc3MgKyBcIm5cIiArIG5jb2xvdXJzICsgXCIgXCIgKyBiYXNlY2xhc3MgKyAoY2F0KzEpO1xyXG4gIH1cclxuXHJcbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGRvbWFpbjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRvbWFpbiA9IGQ7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGJhc2VjbGFzcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJhc2VjbGFzcyA9IHI7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgc3RlcCA9IChkb21haW5bMV0gLSBkb21haW5bMF0pL25jb2xvdXJzO1xyXG4gICAgdmFyIHQgPSBkb21haW5bMF07XHJcbiAgICB2YXIgdGlja3MgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG5jb2xvdXJzOyArK2kpIHtcclxuICAgICAgdGlja3MucHVzaCh0KTtcclxuICAgICAgdCArPSBzdGVwO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRpY2tzO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBzY2FsZTtcclxufVxyXG5cclxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xyXG5ncnBoLnNjYWxlLmNobG9yb3BsZXRoID0gZ3JwaF9zY2FsZV9jaGxvcm9wbGV0aCgpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfY29sb3VyKCkge1xyXG5cclxuICB2YXIgZG9tYWluO1xyXG4gIHZhciByYW5nZSA9IFwiY29sb3VyXCI7XHJcbiAgdmFyIG5jb2xvdXJzO1xyXG5cclxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XHJcbiAgICBpZiAoZG9tYWluID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gYXNzdW1lIHdlIGhhdmUgb25seSAxIGNvbG91clxyXG4gICAgICByZXR1cm4gcmFuZ2UgKyBcIiBcIiArIHJhbmdlICsgXCJuMVwiICsgXCIgXCIgKyByYW5nZSArIDE7XHJcbiAgICB9XHJcbiAgICB2YXIgaSA9IGRvbWFpbi5pbmRleE9mKHYpO1xyXG4gICAgLy8gcmV0dXJucyBzb21ldGhpbmcgbGlrZSBcImNvbG91ciBjb2xvdXJuMTAgY29sb3VyNFwiXHJcbiAgICByZXR1cm4gcmFuZ2UgKyBcIiBcIiArIHJhbmdlICsgXCJuXCIgKyBuY29sb3VycyArIFwiIFwiICsgcmFuZ2UgKyAoaSsxKTtcclxuICB9XHJcblxyXG4gIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKGQpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBkb21haW47XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkb21haW4gPSBkO1xyXG4gICAgICBuY29sb3VycyA9IGQubGVuZ3RoO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHIpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiByYW5nZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJhbmdlID0gcjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBkb21haW47XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHNjYWxlO1xyXG59XHJcblxyXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XHJcbmdycGguc2NhbGUuY29sb3VyID0gZ3JwaF9zY2FsZV9jb2xvdXIoKTtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX3NjYWxlX2xpbmVhcigpIHtcclxuXHJcbiAgdmFyIGxzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpO1xyXG4gIHZhciBsYWJlbF9zaXplXyA9IDIwO1xyXG4gIHZhciBwYWRkaW5nXyA9IDU7XHJcbiAgdmFyIG50aWNrc18gPSAxMDtcclxuICB2YXIgdGlja3NfO1xyXG4gIHZhciBuZGVjXztcclxuICB2YXIgaW5zaWRlXyA9IHRydWU7XHJcblxyXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcclxuICAgIHJldHVybiBsc2NhbGUodik7XHJcbiAgfVxyXG5cclxuICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbihkKSB7XHJcbiAgICBkID0gbHNjYWxlLmRvbWFpbihkKTtcclxuICAgIG5kZWNfID0gdW5kZWZpbmVkO1xyXG4gICAgdGlja3NfID0gdW5kZWZpbmVkO1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHIpIHtcclxuICAgIHIgPSBsc2NhbGUucmFuZ2Uocik7XHJcbiAgICBuZGVjXyA9IHVuZGVmaW5lZDtcclxuICAgIHRpY2tzXyA9IHVuZGVmaW5lZDtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiByO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUubGFiZWxfc2l6ZSA9IGZ1bmN0aW9uKGxhYmVsX3NpemUpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBsYWJlbF9zaXplXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxhYmVsX3NpemVfID0gbGFiZWxfc2l6ZTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZnVuY3Rpb24gbHNpemUobGFiZWwpIHtcclxuICAgIHZhciBzaXplID0gdHlwZW9mKGxhYmVsX3NpemVfKSA9PSBcImZ1bmN0aW9uXCIgPyBsYWJlbF9zaXplXyhsYWJlbCkgOiBsYWJlbF9zaXplXztcclxuICAgIHNpemUgKz0gcGFkZGluZ187XHJcbiAgICByZXR1cm4gc2l6ZTtcclxuICB9XHJcblxyXG4gIHNjYWxlLm50aWNrcyA9IGZ1bmN0aW9uKG4pIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBudGlja3NfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbnRpY2tzXyA9IG47XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLmluc2lkZSA9IGZ1bmN0aW9uKGkpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBpbnNpZGVfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaW5zaWRlXyA9IGkgPyB0cnVlIDogZmFsc2U7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLm5pY2UgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByID0gbHNjYWxlLnJhbmdlKCk7XHJcbiAgICB2YXIgZCA9IGxzY2FsZS5kb21haW4oKTtcclxuICAgIHZhciBsID0gTWF0aC5hYnMoclsxXSAtIHJbMF0pO1xyXG4gICAgdmFyIHcgPSB3aWxraW5zb25faWkoZFswXSwgZFsxXSwgbnRpY2tzXywgbHNpemUsIGwpO1xyXG4gICAgaWYgKGluc2lkZV8pIHtcclxuICAgICAgdmFyIHcxID0gbHNpemUody5sYWJlbHNbMF0pO1xyXG4gICAgICB2YXIgdzIgPSBsc2l6ZSh3LmxhYmVsc1t3LmxhYmVscy5sZW5ndGgtMV0pO1xyXG4gICAgICB2YXIgcGFkID0gdzEvMiArIHcyLzI7XHJcbiAgICAgIHcgPSB3aWxraW5zb25faWkoZFswXSwgZFsxXSwgbnRpY2tzXywgbHNpemUsIGwtcGFkKTtcclxuICAgICAgaWYgKHJbMF0gPCByWzFdKSB7XHJcbiAgICAgICAgbHNjYWxlLnJhbmdlKFtyWzBdK3cxLzIsIHJbMV0tdzIvMl0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxzY2FsZS5yYW5nZShbclswXS13MS8yLCByWzFdK3cyLzJdKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZG9tYWluID0gW3cubG1pbiwgdy5sbWF4XTtcclxuICAgIGxzY2FsZS5kb21haW4oW3cubG1pbiwgdy5sbWF4XSk7XHJcbiAgICB0aWNrc18gPSB3LmxhYmVscztcclxuICAgIG5kZWNfID0gdy5uZGVjO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIGlmICh0aWNrc18gPT09IHVuZGVmaW5lZCkgcmV0dXJuIGxzY2FsZS50aWNrcyhudGlja3NfKTtcclxuICAgIHJldHVybiB0aWNrc18ubWFwKGZ1bmN0aW9uKHQpIHsgcmV0dXJuIGZvcm1hdF9udW1iZXIodCwgXCJcIiwgbmRlY18pO30pO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBzY2FsZTtcclxufVxyXG5cclxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xyXG5ncnBoLnNjYWxlLmxpbmVhciA9IGdycGhfc2NhbGVfbGluZWFyKCk7XHJcblxyXG4iLCJmdW5jdGlvbiBncnBoX3NjYWxlX3BlcmlvZCgpIHtcclxuXHJcbiAgdmFyIHRpbWVfc2NhbGUgPSBkMy50aW1lLnNjYWxlKCk7XHJcbiAgdmFyIHllYXJzXztcclxuICB2YXIgaGFzX21vbnRoXyA9IGZhbHNlO1xyXG4gIHZhciBoYXNfcXVhcnRlcl8gPSBmYWxzZTtcclxuXHJcbiAgZnVuY3Rpb24gc2NhbGUodmFsKSB7XHJcbiAgICBpZiAoKHZhbCBpbnN0YW5jZW9mIERhdGUpIHx8IG1vbWVudC5pc01vbWVudCh2YWwpKSB7XHJcbiAgICAgIHJldHVybiB0aW1lX3NjYWxlKHZhbCk7XHJcbiAgICB9IGVsc2UgaWYgKHZhbCAmJiB2YWwuZGF0ZSAmJiB2YWwucGVyaW9kKSB7XHJcbiAgICAgIHRpbWVfc2NhbGUodmFsLmRhdGUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFsID0gXCJcIiArIHZhbDtcclxuICAgICAgcmV0dXJuIHRpbWVfc2NhbGUoZGF0ZV9wZXJpb2QodmFsKS5kYXRlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNjYWxlLmhhc19tb250aCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGhhc19tb250aF87XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUuaGFzX3F1YXJ0ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBoYXNfcXVhcnRlcl87XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZG9tYWluKSB7XHJcbiAgICB2YXIgcGVyaW9kcyA9IGRvbWFpbi5tYXAoZGF0ZV9wZXJpb2QpO1xyXG4gICAgLy8gZGV0ZXJtaW5lIHdoaWNoIHllYXJzIGFyZSBpbiBkb21haW47IGF4aXMgd2lsIGFsd2F5cyBkcmF3IGNvbXBsZXRlXHJcbiAgICAvLyB5ZWFyc1xyXG4gICAgeWVhcnNfID0gZDMuZXh0ZW50KHBlcmlvZHMsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgcmV0dXJuIGQucGVyaW9kLnN0YXJ0LnllYXIoKTtcclxuICAgIH0pO1xyXG4gICAgLy8gc2V0IGRvbWFpblxyXG4gICAgdGltZV9zY2FsZS5kb21haW4oW25ldyBEYXRlKHllYXJzX1swXSArIFwiLTAxLTAxXCIpLCBcclxuICAgICAgICBuZXcgRGF0ZSgoeWVhcnNfWzFdKzEpICsgXCItMDEtMDFcIildKTtcclxuICAgIC8vIGRldGVybWluZSB3aGljaCBzdWJ1bml0cyBvZiB5ZWFycyBzaG91bGQgYmUgZHJhd25cclxuICAgIGhhc19tb250aF8gPSBwZXJpb2RzLnJlZHVjZShmdW5jdGlvbihwLCBkKSB7XHJcbiAgICAgIHJldHVybiBwIHx8IGQudHlwZSA9PSBcIm1vbnRoXCI7XHJcbiAgICB9LCBmYWxzZSk7XHJcbiAgICBoYXNfcXVhcnRlcl8gPSBwZXJpb2RzLnJlZHVjZShmdW5jdGlvbihwLCBkKSB7XHJcbiAgICAgIHJldHVybiBwIHx8IGQudHlwZSA9PSBcInF1YXJ0ZXJcIjtcclxuICAgIH0sIGZhbHNlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocmFuZ2UpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdGltZV9zY2FsZS5yYW5nZSgpO1xyXG4gICAgdGltZV9zY2FsZS5yYW5nZShyYW5nZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHRpY2tzID0gW107XHJcbiAgICBmb3IgKHZhciB5ZWFyID0geWVhcnNfWzBdOyB5ZWFyIDw9IHllYXJzX1sxXTsgeWVhcisrKSB7XHJcbiAgICAgIHZhciB0aWNrID0gZGF0ZV9wZXJpb2QoeWVhciArIFwiLTAxLTAxL1AxWVwiKTtcclxuICAgICAgdGljay5sYXN0ID0geWVhciA9PSB5ZWFyc19bMV07XHJcbiAgICAgIHRpY2subGFiZWwgPSB5ZWFyO1xyXG4gICAgICB0aWNrcy5wdXNoKHRpY2spO1xyXG5cclxuICAgICAgaWYgKHNjYWxlLmhhc19xdWFydGVyKCkpIHtcclxuICAgICAgICBmb3IgKHZhciBxID0gMDsgcSA8IDQ7IHErKykge1xyXG4gICAgICAgICAgdGljayA9IGRhdGVfcGVyaW9kKHllYXIgKyBcIi1cIiArIHplcm9QYWQocSozKzEsIDIpICsgXCItMDEvUDNNXCIpO1xyXG4gICAgICAgICAgdGljay5sYXN0ID0gcSA9PSAzO1xyXG4gICAgICAgICAgdGljay5sYWJlbCA9IHErMTtcclxuICAgICAgICAgIHRpY2tzLnB1c2godGljayk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IFxyXG4gICAgICBpZiAoc2NhbGUuaGFzX21vbnRoKCkpIHtcclxuICAgICAgICBmb3IgKHZhciBtID0gMDsgbSA8IDEyOyBtKyspIHtcclxuICAgICAgICAgIHRpY2sgPSBkYXRlX3BlcmlvZCh5ZWFyICsgXCItXCIgKyB6ZXJvUGFkKG0rMSwyKSArIFwiLTAxL1AxTVwiKTtcclxuICAgICAgICAgIHRpY2subGFzdCA9IChzY2FsZS5oYXNfcXVhcnRlcigpICYmICgobSsxKSAlIDMpID09PSAwKSB8fCBtID09IDExO1xyXG4gICAgICAgICAgdGljay5sYWJlbCA9IG0rMTtcclxuICAgICAgICAgIHRpY2tzLnB1c2godGljayk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRpY2tzO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBzY2FsZTtcclxufVxyXG5cclxuXHJcbmlmIChncnBoLnNjYWxlID09PSB1bmRlZmluZWQpIGdycGguc2NhbGUgPSB7fTtcclxuZ3JwaC5zY2FsZS5wZXJpb2QgPSBncnBoX3NjYWxlX3BlcmlvZCgpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfc2l6ZSgpIHtcclxuICBcclxuICB2YXIgbWF4O1xyXG4gIHZhciBkb21haW47XHJcblxyXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcclxuICAgIGlmIChkb21haW4gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gc2V0dGluZ3MoXCJkZWZhdWx0X2J1YmJsZVwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciBtID0gbWF4ID09PSB1bmRlZmluZWQgPyBzZXR0aW5ncyhcIm1heF9idWJibGVcIikgOiBtYXg7XHJcbiAgICAgIHJldHVybiBtICogTWF0aC5zcXJ0KHYpL01hdGguc3FydChkb21haW5bMV0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGRvbWFpbjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRvbWFpbiA9IGQzLmV4dGVudChkKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUucmFuZ2UgPSBmdW5jdGlvbihyKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gbWF4ID09PSB1bmRlZmluZWQgPyBzZXR0aW5ncyhcIm1heF9idWJibGVcIikgOiBtYXg7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBtYXggPSBkMy5tYXgocik7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBzY2FsZTtcclxufVxyXG5cclxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xyXG5ncnBoLnNjYWxlLnNpemUgPSBncnBoX3NjYWxlX3NpemUoKTtcclxuXHJcbiIsIlxyXG5cclxudmFyIHNldHRpbmdzID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHMgPSB7XHJcbiAgICAnZGVmYXVsdCcgOiB7XHJcbiAgICAgICdwYWRkaW5nJyA6IFsyLCAyLCAyLCAyXSxcclxuICAgICAgJ2xhYmVsX3BhZGRpbmcnIDogNCxcclxuICAgICAgJ3NlcCcgOiA4LFxyXG4gICAgICAncG9pbnRfc2l6ZScgOiA0LFxyXG4gICAgICAnbWF4X2J1YmJsZScgOiAyMCxcclxuICAgICAgJ2RlZmF1bHRfYnViYmxlJyA6IDUsXHJcbiAgICAgICdiYXJfcGFkZGluZycgOiAwLjQsXHJcbiAgICAgICd0aWNrX2xlbmd0aCcgOiA1LFxyXG4gICAgICAndGlja19wYWRkaW5nJyA6IDJcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBmdW5jdGlvbiBnZXQoc2V0dGluZywgdHlwZSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHNldHRpbmdzO1xyXG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgIGlmIChzW3R5cGVdICE9PSB1bmRlZmluZWQgJiYgc1t0eXBlXVtzZXR0aW5nXSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIHNbdHlwZV1bc2V0dGluZ107XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHMuZGVmYXVsdFtzZXR0aW5nXTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHMuZGVmYXVsdFtzZXR0aW5nXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGdldC5zZXQgPSBmdW5jdGlvbihzZXR0aW5nLCBhLCBiKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICBzLmRlZmF1bHRbc2V0dGluZ10gPSBhO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xyXG4gICAgICBpZiAoc1thXSA9PT0gdW5kZWZpbmVkKSBzW2FdID0ge307XHJcbiAgICAgIHNbYV1bc2V0dGluZ10gPSBiO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5lZWQgYXQgbGVhdCB0d28gYXJndW1lbnRzLlwiKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gZ2V0O1xyXG59KCk7XHJcblxyXG5ncnBoLnNldHRpbmdzID0gc2V0dGluZ3M7XHJcbiIsIlxyXG4vLyBDb252ZXJ0IGEgbnVtYmVyIHRvIHN0cmluZyBwYWRkaW5nIGl0IHdpdGggemVyb3MgdW50aWwgdGhlIG51bWJlciBvZiBcclxuLy8gY2hhcmFjdGVycyBiZWZvcmUgdGhlIGRlY2ltYWwgc3ltYm9sIGVxdWFscyBsZW5ndGggKG5vdCBpbmNsdWRpbmcgc2lnbilcclxuZnVuY3Rpb24gemVyb19wYWQobnVtLCBsZW5ndGgpIHtcclxuICB2YXIgbiA9IE1hdGguYWJzKG51bSk7XHJcbiAgdmFyIG56ZXJvcyA9IE1hdGgubWF4KDAsIGxlbmd0aCAtIE1hdGguZmxvb3IobikudG9TdHJpbmcoKS5sZW5ndGggKTtcclxuICB2YXIgcGFkZGluZyA9IE1hdGgucG93KDEwLCBuemVyb3MpLnRvU3RyaW5nKCkuc3Vic3RyKDEpO1xyXG4gIGlmKCBudW0gPCAwICkge1xyXG4gICAgcGFkZGluZyA9ICctJyArIHBhZGRpbmc7XHJcbiAgfVxyXG4gIHJldHVybiBwYWRkaW5nICsgbjtcclxufVxyXG5cclxuXHJcbi8vIEZvcm1hdCBhIG51bWVyaWMgdmFsdWU6XHJcbi8vIC0gTWFrZSBzdXJlIGl0IGlzIHJvdW5kZWQgdG8gdGhlIGNvcnJlY3QgbnVtYmVyIG9mIGRlY2ltYWxzIChuZGVjKVxyXG4vLyAtIFVzZSB0aGUgY29ycmVjdCBkZWNpbWFsIHNlcGFyYXRvciAoZGVjKVxyXG4vLyAtIEFkZCBhIHRob3VzYW5kcyBzZXBhcmF0b3IgKGdycClcclxuZnVuY3Rpb24gZm9ybWF0X251bWJlcihsYWJlbCwgdW5pdCwgbmRlYywgZGVjLCBncnApIHtcclxuICBpZiAoaXNOYU4obGFiZWwpKSByZXR1cm4gJyc7XHJcbiAgaWYgKHVuaXQgPT09IHVuZGVmaW5lZCkgdW5pdCA9ICcnO1xyXG4gIGlmIChkZWMgPT09IHVuZGVmaW5lZCkgZGVjID0gJy4nO1xyXG4gIGlmIChncnAgPT09IHVuZGVmaW5lZCkgZ3JwID0gJyc7XHJcbiAgLy8gcm91bmQgbnVtYmVyXHJcbiAgaWYgKG5kZWMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgbGFiZWwgPSBsYWJlbC50b0ZpeGVkKG5kZWMpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBsYWJlbCA9IGxhYmVsLnRvU3RyaW5nKCk7XHJcbiAgfVxyXG4gIC8vIEZvbGxvd2luZyBiYXNlZCBvbiBjb2RlIGZyb20gXHJcbiAgLy8gaHR0cDovL3d3dy5tcmVka2ouY29tL2phdmFzY3JpcHQvbnVtYmVyRm9ybWF0Lmh0bWxcclxuICB4ICAgICA9IGxhYmVsLnNwbGl0KCcuJyk7XHJcbiAgeDEgICAgPSB4WzBdO1xyXG4gIHgyICAgID0geC5sZW5ndGggPiAxID8gZGVjICsgeFsxXSA6ICcnO1xyXG4gIGlmIChncnAgIT09ICcnKSB7XHJcbiAgICB2YXIgcmd4ID0gLyhcXGQrKShcXGR7M30pLztcclxuICAgIHdoaWxlIChyZ3gudGVzdCh4MSkpIHtcclxuICAgICAgeDEgPSB4MS5yZXBsYWNlKHJneCwgJyQxJyArIGdycCArICckMicpO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4oeDEgKyB4MiArIHVuaXQpO1xyXG59XHJcblxyXG5cclxuXHJcbiIsIlxyXG4vLyBGb3JtYXQgYSBudW1lcmljIHZhbHVlOlxyXG4vLyAtIE1ha2Ugc3VyZSBpdCBpcyByb3VuZGVkIHRvIHRoZSBjb3JyZWN0IG51bWJlciBvZiBkZWNpbWFscyAobmRlYylcclxuLy8gLSBVc2UgdGhlIGNvcnJlY3QgZGVjaW1hbCBzZXBhcmF0b3IgKGRlYylcclxuLy8gLSBBZGQgYSB0aG91c2FuZHMgc2VwYXJhdG9yIChncnApXHJcbmZvcm1hdF9udW1lcmljID0gZnVuY3Rpb24obGFiZWwsIHVuaXQsIG5kZWMsIGRlYywgZ3JwKSB7XHJcbiAgaWYgKGlzTmFOKGxhYmVsKSkgcmV0dXJuICcnO1xyXG4gIGlmICh1bml0ID09PSB1bmRlZmluZWQpIHVuaXQgPSAnJztcclxuICBpZiAoZGVjID09PSB1bmRlZmluZWQpIGRlYyA9ICcsJztcclxuICBpZiAoZ3JwID09PSB1bmRlZmluZWQpIGdycCA9ICcgJztcclxuICAvLyByb3VuZCBudW1iZXJcclxuICBpZiAobmRlYyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBsYWJlbCA9IGxhYmVsLnRvRml4ZWQobmRlYyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGxhYmVsID0gbGFiZWwudG9TdHJpbmcoKTtcclxuICB9XHJcbiAgLy8gRm9sbG93aW5nIGJhc2VkIG9uIGNvZGUgZnJvbSBcclxuICAvLyBodHRwOi8vd3d3Lm1yZWRrai5jb20vamF2YXNjcmlwdC9udW1iZXJGb3JtYXQuaHRtbFxyXG4gIHggICAgID0gbGFiZWwuc3BsaXQoJy4nKTtcclxuICB4MSAgICA9IHhbMF07XHJcbiAgeDIgICAgPSB4Lmxlbmd0aCA+IDEgPyBkZWMgKyB4WzFdIDogJyc7XHJcbiAgaWYgKGdycCAhPT0gJycpIHtcclxuICAgIHZhciByZ3ggPSAvKFxcZCspKFxcZHszfSkvO1xyXG4gICAgd2hpbGUgKHJneC50ZXN0KHgxKSkge1xyXG4gICAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgZ3JwICsgJyQyJyk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybih4MSArIHgyICsgdW5pdCk7XHJcbn07XHJcblxyXG5cclxuXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLy8gPT09PSAgICAgICAgICAgICAgICAgICAgICAgICBXSUxLSU5TT04gQUxHT1JJVEhNICAgICAgICAgICAgICAgICAgICAgICAgPT09PVxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG5cclxuZnVuY3Rpb24gd2lsa2luc29uX2lpKGRtaW4sIGRtYXgsIG0sIGNhbGNfbGFiZWxfd2lkdGgsIGF4aXNfd2lkdGgsIG1taW4sIG1tYXgsIFEsIHByZWNpc2lvbiwgbWluY292ZXJhZ2UpIHtcclxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09IFNVQlJPVVRJTkVTID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAvLyBUaGUgZm9sbG93aW5nIHJvdXRpbmUgY2hlY2tzIGZvciBvdmVybGFwIGluIHRoZSBsYWJlbHMuIFRoaXMgaXMgdXNlZCBpbiB0aGUgXHJcbiAgLy8gV2lsa2luc29uIGxhYmVsaW5nIGFsZ29yaXRobSBiZWxvdyB0byBlbnN1cmUgdGhhdCB0aGUgbGFiZWxzIGRvIG5vdCBvdmVybGFwLlxyXG4gIGZ1bmN0aW9uIG92ZXJsYXAobG1pbiwgbG1heCwgbHN0ZXAsIGNhbGNfbGFiZWxfd2lkdGgsIGF4aXNfd2lkdGgsIG5kZWMpIHtcclxuICAgIHZhciB3aWR0aF9tYXggPSBsc3RlcCpheGlzX3dpZHRoLyhsbWF4LWxtaW4pO1xyXG4gICAgZm9yICh2YXIgbCA9IGxtaW47IChsIC0gbG1heCkgPD0gMUUtMTA7IGwgKz0gbHN0ZXApIHtcclxuICAgICAgdmFyIHcgID0gY2FsY19sYWJlbF93aWR0aChsLCBuZGVjKTtcclxuICAgICAgaWYgKHcgPiB3aWR0aF9tYXgpIHJldHVybih0cnVlKTtcclxuICAgIH1cclxuICAgIHJldHVybihmYWxzZSk7XHJcbiAgfVxyXG5cclxuICAvLyBQZXJmb3JtIG9uZSBpdGVyYXRpb24gb2YgdGhlIFdpbGtpbnNvbiBhbGdvcml0aG1cclxuICBmdW5jdGlvbiB3aWxraW5zb25fc3RlcChtaW4sIG1heCwgaywgbSwgUSwgbWluY292ZXJhZ2UpIHtcclxuICAgIC8vIGRlZmF1bHQgdmFsdWVzXHJcbiAgICBRICAgICAgICAgICAgICAgPSBRICAgICAgICAgfHwgWzEwLCAxLCA1LCAyLCAyLjUsIDMsIDQsIDEuNSwgNywgNiwgOCwgOV07XHJcbiAgICBwcmVjaXNpb24gICAgICAgPSBwcmVjaXNpb24gfHwgWzEsICAwLCAwLCAwLCAgLTEsIDAsIDAsICAtMSwgMCwgMCwgMCwgMF07XHJcbiAgICBtaW5jb3ZlcmFnZSAgICAgPSBtaW5jb3ZlcmFnZSB8fCAwLjg7XHJcbiAgICBtICAgICAgICAgICAgICAgPSBtIHx8IGs7XHJcbiAgICAvLyBjYWxjdWxhdGUgc29tZSBzdGF0cyBuZWVkZWQgaW4gbG9vcFxyXG4gICAgdmFyIGludGVydmFscyAgID0gayAtIDE7XHJcbiAgICB2YXIgZGVsdGEgICAgICAgPSAobWF4IC0gbWluKSAvIGludGVydmFscztcclxuICAgIHZhciBiYXNlICAgICAgICA9IE1hdGguZmxvb3IoTWF0aC5sb2coZGVsdGEpL01hdGguTE4xMCk7XHJcbiAgICB2YXIgZGJhc2UgICAgICAgPSBNYXRoLnBvdygxMCwgYmFzZSk7XHJcbiAgICAvLyBjYWxjdWxhdGUgZ3JhbnVsYXJpdHk7IG9uZSBvZiB0aGUgdGVybXMgaW4gc2NvcmVcclxuICAgIHZhciBncmFudWxhcml0eSA9IDEgLSBNYXRoLmFicyhrLW0pL207XHJcbiAgICAvLyBpbml0aWFsaXNlIGVuZCByZXN1bHRcclxuICAgIHZhciBiZXN0O1xyXG4gICAgLy8gbG9vcCB0aHJvdWdoIGFsbCBwb3NzaWJsZSBsYWJlbCBwb3NpdGlvbnMgd2l0aCBnaXZlbiBrXHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgUS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAvLyBjYWxjdWxhdGUgbGFiZWwgcG9zaXRpb25zXHJcbiAgICAgIHZhciB0ZGVsdGEgPSBRW2ldICogZGJhc2U7XHJcbiAgICAgIHZhciB0bWluICAgPSBNYXRoLmZsb29yKG1pbi90ZGVsdGEpICogdGRlbHRhO1xyXG4gICAgICB2YXIgdG1heCAgID0gdG1pbiArIGludGVydmFscyAqIHRkZWx0YTtcclxuICAgICAgLy8gY2FsY3VsYXRlIHRoZSBudW1iZXIgb2YgZGVjaW1hbHNcclxuICAgICAgdmFyIG5kZWMgICA9IChiYXNlICsgcHJlY2lzaW9uW2ldKSA8IDAgPyBNYXRoLmFicyhiYXNlICsgcHJlY2lzaW9uW2ldKSA6IDA7XHJcbiAgICAgIC8vIGlmIGxhYmVsIHBvc2l0aW9ucyBjb3ZlciByYW5nZVxyXG4gICAgICBpZiAodG1pbiA8PSBtaW4gJiYgdG1heCA+PSBtYXgpIHtcclxuICAgICAgICAvLyBjYWxjdWxhdGUgcm91bmRuZXNzIGFuZCBjb3ZlcmFnZSBwYXJ0IG9mIHNjb3JlXHJcbiAgICAgICAgdmFyIHJvdW5kbmVzcyA9IDEgLSAoaSAtICh0bWluIDw9IDAgJiYgdG1heCA+PSAwKSkgLyBRLmxlbmd0aDtcclxuICAgICAgICB2YXIgY292ZXJhZ2UgID0gKG1heC1taW4pLyh0bWF4LXRtaW4pO1xyXG4gICAgICAgIC8vIGlmIGNvdmVyYWdlIGhpZ2ggZW5vdWdoXHJcbiAgICAgICAgaWYgKGNvdmVyYWdlID4gbWluY292ZXJhZ2UgJiYgIW92ZXJsYXAodG1pbiwgdG1heCwgdGRlbHRhLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBuZGVjKSkge1xyXG4gICAgICAgICAgLy8gY2FsY3VsYXRlIHNjb3JlXHJcbiAgICAgICAgICB2YXIgdG5pY2UgPSBncmFudWxhcml0eSArIHJvdW5kbmVzcyArIGNvdmVyYWdlO1xyXG4gICAgICAgICAgLy8gaWYgaGlnaGVzdCBzY29yZVxyXG4gICAgICAgICAgaWYgKChiZXN0ID09PSB1bmRlZmluZWQpIHx8ICh0bmljZSA+IGJlc3Quc2NvcmUpKSB7XHJcbiAgICAgICAgICAgIGJlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAnbG1pbicgIDogdG1pbixcclxuICAgICAgICAgICAgICAgICdsbWF4JyAgOiB0bWF4LFxyXG4gICAgICAgICAgICAgICAgJ2xzdGVwJyA6IHRkZWx0YSxcclxuICAgICAgICAgICAgICAgICdzY29yZScgOiB0bmljZSxcclxuICAgICAgICAgICAgICAgICduZGVjJyAgOiBuZGVjXHJcbiAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIHJldHVyblxyXG4gICAgcmV0dXJuIChiZXN0KTtcclxuICB9XHJcblxyXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gTUFJTiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgLy8gZGVmYXVsdCB2YWx1ZXNcclxuICBkbWluICAgICAgICAgICAgID0gTnVtYmVyKGRtaW4pO1xyXG4gIGRtYXggICAgICAgICAgICAgPSBOdW1iZXIoZG1heCk7XHJcbiAgaWYgKE1hdGguYWJzKGRtaW4gLSBkbWF4KSA8IDFFLTEwKSB7XHJcbiAgICBkbWluID0gMC45NipkbWluO1xyXG4gICAgZG1heCA9IDEuMDQqZG1heDtcclxuICB9XHJcbiAgY2FsY19sYWJlbF93aWR0aCA9IGNhbGNfbGFiZWxfd2lkdGggfHwgZnVuY3Rpb24oKSB7IHJldHVybigwKTt9O1xyXG4gIGF4aXNfd2lkdGggICAgICAgPSBheGlzX3dpZHRoIHx8IDE7XHJcbiAgUSAgICAgICAgICAgICAgICA9IFEgICAgICAgICB8fCBbMTAsIDEsIDUsIDIsIDIuNSwgMywgNCwgMS41LCA3LCA2LCA4LCA5XTtcclxuICBwcmVjaXNpb24gICAgICAgID0gcHJlY2lzaW9uIHx8IFsxLCAgMCwgMCwgMCwgIC0xLCAwLCAwLCAgLTEsIDAsIDAsIDAsIDBdO1xyXG4gIG1pbmNvdmVyYWdlICAgICAgPSBtaW5jb3ZlcmFnZSB8fCAwLjg7XHJcbiAgbW1pbiAgICAgICAgICAgICA9IG1taW4gfHwgMjtcclxuICBtbWF4ICAgICAgICAgICAgID0gbW1heCB8fCBNYXRoLmNlaWwoNiptKTtcclxuICAvLyBpbml0aWxpc2UgZW5kIHJlc3VsdFxyXG4gIHZhciBiZXN0ID0ge1xyXG4gICAgICAnbG1pbicgIDogZG1pbixcclxuICAgICAgJ2xtYXgnICA6IGRtYXgsXHJcbiAgICAgICdsc3RlcCcgOiAoZG1heCAtIGRtaW4pLFxyXG4gICAgICAnc2NvcmUnIDogLTFFOCxcclxuICAgICAgJ25kZWMnICA6IDBcclxuICAgIH07XHJcbiAgLy8gY2FsY3VsYXRlIG51bWJlciBvZiBkZWNpbWFsIHBsYWNlc1xyXG4gIHZhciB4ID0gU3RyaW5nKGJlc3QubHN0ZXApLnNwbGl0KCcuJyk7XHJcbiAgYmVzdC5uZGVjID0geC5sZW5ndGggPiAxID8geFsxXS5sZW5ndGggOiAwO1xyXG4gIC8vIGxvb3AgdGhvdWdoIGFsbCBwb3NzaWJsZSBudW1iZXJzIG9mIGxhYmVsc1xyXG4gIGZvciAodmFyIGsgPSBtbWluOyBrIDw9IG1tYXg7IGsrKykgeyBcclxuICAgIC8vIGNhbGN1bGF0ZSBiZXN0IGxhYmVsIHBvc2l0aW9uIGZvciBjdXJyZW50IG51bWJlciBvZiBsYWJlbHNcclxuICAgIHZhciByZXN1bHQgPSB3aWxraW5zb25fc3RlcChkbWluLCBkbWF4LCBrLCBtLCBRLCBtaW5jb3ZlcmFnZSk7XHJcbiAgICAvLyBjaGVjayBpZiBjdXJyZW50IHJlc3VsdCBoYXMgaGlnaGVyIHNjb3JlXHJcbiAgICBpZiAoKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSAmJiAoKGJlc3QgPT09IHVuZGVmaW5lZCkgfHwgKHJlc3VsdC5zY29yZSA+IGJlc3Quc2NvcmUpKSkge1xyXG4gICAgICBiZXN0ID0gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuICAvLyBnZW5lcmF0ZSBsYWJlbCBwb3NpdGlvbnNcclxuICB2YXIgbGFiZWxzID0gW107XHJcbiAgZm9yICh2YXIgbCA9IGJlc3QubG1pbjsgKGwgLSBiZXN0LmxtYXgpIDw9IDFFLTEwOyBsICs9IGJlc3QubHN0ZXApIHtcclxuICAgIGxhYmVscy5wdXNoKGwpO1xyXG4gIH1cclxuICBiZXN0LmxhYmVscyA9IGxhYmVscztcclxuICByZXR1cm4oYmVzdCk7XHJcbn1cclxuXHJcblxyXG4iLCIgIFxyXG4gIGdycGgubGluZSA9IGdycGhfZ3JhcGhfbGluZTtcclxuICBncnBoLm1hcCA9IGdycGhfZ3JhcGhfbWFwO1xyXG4gIGdycGguYnViYmxlID0gZ3JwaF9ncmFwaF9idWJibGU7XHJcbiAgZ3JwaC5iYXIgPSBncnBoX2dyYXBoX2JhcjtcclxuXHJcbiAgdGhpcy5ncnBoID0gZ3JwaDtcclxuXHJcbn0oKSk7XHJcblxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=