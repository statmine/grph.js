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
    return vschema.type == 'date' || vschema.type == 'period';
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
	var unit = field.unit || "";
	return function(value){
		return value + unit || "-";
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
          tick = date_period(year + "-" + zero_pad(q*3+1, 2) + "-01/P3M");
          tick.last = q == 3;
          tick.label = q+1;
          ticks.push(tick);
        }
      } 
      if (scale.has_month()) {
        for (var m = 0; m < 12; m++) {
          tick = date_period(year + "-" + zero_pad(m+1,2) + "-01/P1M");
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vbWVudC5qcyIsInR3aXguanMiLCJiZWdpbi5qcyIsImF4aXNfY2F0ZWdvcmljYWwuanMiLCJheGlzX2NobG9yb3BsZXRoLmpzIiwiYXhpc19jb2xvdXIuanMiLCJheGlzX2xpbmVhci5qcyIsImF4aXNfcGVyaW9kLmpzIiwiYXhpc19yZWdpb24uanMiLCJheGlzX3NpemUuanMiLCJheGlzX3NwbGl0LmpzIiwiYXhpc19zd2l0Y2guanMiLCJkYXRhcGFja2FnZS5qcyIsImRhdGVfcGVyaW9kLmpzIiwiZ2VuZXJpY19ncmFwaC5qcyIsImdyYXBoLmpzIiwiZ3JhcGhfYmFyLmpzIiwiZ3JhcGhfYnViYmxlLmpzIiwiZ3JhcGhfbGluZS5qcyIsImdyYXBoX21hcC5qcyIsImxhYmVsX3NpemUuanMiLCJzY2FsZV9jYXRlZ29yaWNhbC5qcyIsInNjYWxlX2NobG9yb3BsZXRoLmpzIiwic2NhbGVfY29sb3VyLmpzIiwic2NhbGVfbGluZWFyLmpzIiwic2NhbGVfcGVyaW9kLmpzIiwic2NhbGVfc2l6ZS5qcyIsInNldHRpbmdzLmpzIiwidXRpbHMuanMiLCJ3aWxraW5zb24uanMiLCJlbmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNXRCQTtBQUNBO0FBQ0E7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJncnBoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8hIG1vbWVudC5qc1xyXG4vLyEgdmVyc2lvbiA6IDIuNy4wXHJcbi8vISBhdXRob3JzIDogVGltIFdvb2QsIElza3JlbiBDaGVybmV2LCBNb21lbnQuanMgY29udHJpYnV0b3JzXHJcbi8vISBsaWNlbnNlIDogTUlUXHJcbi8vISBtb21lbnRqcy5jb21cclxuXHJcbihmdW5jdGlvbiAodW5kZWZpbmVkKSB7XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIENvbnN0YW50c1xyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICAgIHZhciBtb21lbnQsXHJcbiAgICAgICAgVkVSU0lPTiA9IFwiMi43LjBcIixcclxuICAgICAgICAvLyB0aGUgZ2xvYmFsLXNjb3BlIHRoaXMgaXMgTk9UIHRoZSBnbG9iYWwgb2JqZWN0IGluIE5vZGUuanNcclxuICAgICAgICBnbG9iYWxTY29wZSA9IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcyxcclxuICAgICAgICBvbGRHbG9iYWxNb21lbnQsXHJcbiAgICAgICAgcm91bmQgPSBNYXRoLnJvdW5kLFxyXG4gICAgICAgIGksXHJcblxyXG4gICAgICAgIFlFQVIgPSAwLFxyXG4gICAgICAgIE1PTlRIID0gMSxcclxuICAgICAgICBEQVRFID0gMixcclxuICAgICAgICBIT1VSID0gMyxcclxuICAgICAgICBNSU5VVEUgPSA0LFxyXG4gICAgICAgIFNFQ09ORCA9IDUsXHJcbiAgICAgICAgTUlMTElTRUNPTkQgPSA2LFxyXG5cclxuICAgICAgICAvLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsYW5ndWFnZSBjb25maWcgZmlsZXNcclxuICAgICAgICBsYW5ndWFnZXMgPSB7fSxcclxuXHJcbiAgICAgICAgLy8gbW9tZW50IGludGVybmFsIHByb3BlcnRpZXNcclxuICAgICAgICBtb21lbnRQcm9wZXJ0aWVzID0ge1xyXG4gICAgICAgICAgICBfaXNBTW9tZW50T2JqZWN0OiBudWxsLFxyXG4gICAgICAgICAgICBfaSA6IG51bGwsXHJcbiAgICAgICAgICAgIF9mIDogbnVsbCxcclxuICAgICAgICAgICAgX2wgOiBudWxsLFxyXG4gICAgICAgICAgICBfc3RyaWN0IDogbnVsbCxcclxuICAgICAgICAgICAgX3R6bSA6IG51bGwsXHJcbiAgICAgICAgICAgIF9pc1VUQyA6IG51bGwsXHJcbiAgICAgICAgICAgIF9vZmZzZXQgOiBudWxsLCAgLy8gb3B0aW9uYWwuIENvbWJpbmUgd2l0aCBfaXNVVENcclxuICAgICAgICAgICAgX3BmIDogbnVsbCxcclxuICAgICAgICAgICAgX2xhbmcgOiBudWxsICAvLyBvcHRpb25hbFxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIGNoZWNrIGZvciBub2RlSlNcclxuICAgICAgICBoYXNNb2R1bGUgPSAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpLFxyXG5cclxuICAgICAgICAvLyBBU1AuTkVUIGpzb24gZGF0ZSBmb3JtYXQgcmVnZXhcclxuICAgICAgICBhc3BOZXRKc29uUmVnZXggPSAvXlxcLz9EYXRlXFwoKFxcLT9cXGQrKS9pLFxyXG4gICAgICAgIGFzcE5ldFRpbWVTcGFuSnNvblJlZ2V4ID0gLyhcXC0pPyg/OihcXGQqKVxcLik/KFxcZCspXFw6KFxcZCspKD86XFw6KFxcZCspXFwuPyhcXGR7M30pPyk/LyxcclxuXHJcbiAgICAgICAgLy8gZnJvbSBodHRwOi8vZG9jcy5jbG9zdXJlLWxpYnJhcnkuZ29vZ2xlY29kZS5jb20vZ2l0L2Nsb3N1cmVfZ29vZ19kYXRlX2RhdGUuanMuc291cmNlLmh0bWxcclxuICAgICAgICAvLyBzb21ld2hhdCBtb3JlIGluIGxpbmUgd2l0aCA0LjQuMy4yIDIwMDQgc3BlYywgYnV0IGFsbG93cyBkZWNpbWFsIGFueXdoZXJlXHJcbiAgICAgICAgaXNvRHVyYXRpb25SZWdleCA9IC9eKC0pP1AoPzooPzooWzAtOSwuXSopWSk/KD86KFswLTksLl0qKU0pPyg/OihbMC05LC5dKilEKT8oPzpUKD86KFswLTksLl0qKUgpPyg/OihbMC05LC5dKilNKT8oPzooWzAtOSwuXSopUyk/KT98KFswLTksLl0qKVcpJC8sXHJcblxyXG4gICAgICAgIC8vIGZvcm1hdCB0b2tlbnNcclxuICAgICAgICBmb3JtYXR0aW5nVG9rZW5zID0gLyhcXFtbXlxcW10qXFxdKXwoXFxcXCk/KE1vfE1NP00/TT98RG98REREb3xERD9EP0Q/fGRkZD9kP3xkbz98d1tvfHddP3xXW298V10/fFF8WVlZWVlZfFlZWVlZfFlZWVl8WVl8Z2coZ2dnPyk/fEdHKEdHRz8pP3xlfEV8YXxBfGhoP3xISD98bW0/fHNzP3xTezEsNH18WHx6ej98Wlo/fC4pL2csXHJcbiAgICAgICAgbG9jYWxGb3JtYXR0aW5nVG9rZW5zID0gLyhcXFtbXlxcW10qXFxdKXwoXFxcXCk/KExUfExMP0w/TD98bHsxLDR9KS9nLFxyXG5cclxuICAgICAgICAvLyBwYXJzaW5nIHRva2VuIHJlZ2V4ZXNcclxuICAgICAgICBwYXJzZVRva2VuT25lT3JUd29EaWdpdHMgPSAvXFxkXFxkPy8sIC8vIDAgLSA5OVxyXG4gICAgICAgIHBhcnNlVG9rZW5PbmVUb1RocmVlRGlnaXRzID0gL1xcZHsxLDN9LywgLy8gMCAtIDk5OVxyXG4gICAgICAgIHBhcnNlVG9rZW5PbmVUb0ZvdXJEaWdpdHMgPSAvXFxkezEsNH0vLCAvLyAwIC0gOTk5OVxyXG4gICAgICAgIHBhcnNlVG9rZW5PbmVUb1NpeERpZ2l0cyA9IC9bK1xcLV0/XFxkezEsNn0vLCAvLyAtOTk5LDk5OSAtIDk5OSw5OTlcclxuICAgICAgICBwYXJzZVRva2VuRGlnaXRzID0gL1xcZCsvLCAvLyBub256ZXJvIG51bWJlciBvZiBkaWdpdHNcclxuICAgICAgICBwYXJzZVRva2VuV29yZCA9IC9bMC05XSpbJ2EtelxcdTAwQTAtXFx1MDVGRlxcdTA3MDAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0rfFtcXHUwNjAwLVxcdTA2RkZcXC9dKyhcXHMqP1tcXHUwNjAwLVxcdTA2RkZdKyl7MSwyfS9pLCAvLyBhbnkgd29yZCAob3IgdHdvKSBjaGFyYWN0ZXJzIG9yIG51bWJlcnMgaW5jbHVkaW5nIHR3by90aHJlZSB3b3JkIG1vbnRoIGluIGFyYWJpYy5cclxuICAgICAgICBwYXJzZVRva2VuVGltZXpvbmUgPSAvWnxbXFwrXFwtXVxcZFxcZDo/XFxkXFxkL2dpLCAvLyArMDA6MDAgLTAwOjAwICswMDAwIC0wMDAwIG9yIFpcclxuICAgICAgICBwYXJzZVRva2VuVCA9IC9UL2ksIC8vIFQgKElTTyBzZXBhcmF0b3IpXHJcbiAgICAgICAgcGFyc2VUb2tlblRpbWVzdGFtcE1zID0gL1tcXCtcXC1dP1xcZCsoXFwuXFxkezEsM30pPy8sIC8vIDEyMzQ1Njc4OSAxMjM0NTY3ODkuMTIzXHJcbiAgICAgICAgcGFyc2VUb2tlbk9yZGluYWwgPSAvXFxkezEsMn0vLFxyXG5cclxuICAgICAgICAvL3N0cmljdCBwYXJzaW5nIHJlZ2V4ZXNcclxuICAgICAgICBwYXJzZVRva2VuT25lRGlnaXQgPSAvXFxkLywgLy8gMCAtIDlcclxuICAgICAgICBwYXJzZVRva2VuVHdvRGlnaXRzID0gL1xcZFxcZC8sIC8vIDAwIC0gOTlcclxuICAgICAgICBwYXJzZVRva2VuVGhyZWVEaWdpdHMgPSAvXFxkezN9LywgLy8gMDAwIC0gOTk5XHJcbiAgICAgICAgcGFyc2VUb2tlbkZvdXJEaWdpdHMgPSAvXFxkezR9LywgLy8gMDAwMCAtIDk5OTlcclxuICAgICAgICBwYXJzZVRva2VuU2l4RGlnaXRzID0gL1srLV0/XFxkezZ9LywgLy8gLTk5OSw5OTkgLSA5OTksOTk5XHJcbiAgICAgICAgcGFyc2VUb2tlblNpZ25lZE51bWJlciA9IC9bKy1dP1xcZCsvLCAvLyAtaW5mIC0gaW5mXHJcblxyXG4gICAgICAgIC8vIGlzbyA4NjAxIHJlZ2V4XHJcbiAgICAgICAgLy8gMDAwMC0wMC0wMCAwMDAwLVcwMCBvciAwMDAwLVcwMC0wICsgVCArIDAwIG9yIDAwOjAwIG9yIDAwOjAwOjAwIG9yIDAwOjAwOjAwLjAwMCArICswMDowMCBvciArMDAwMCBvciArMDApXHJcbiAgICAgICAgaXNvUmVnZXggPSAvXlxccyooPzpbKy1dXFxkezZ9fFxcZHs0fSktKD86KFxcZFxcZC1cXGRcXGQpfChXXFxkXFxkJCl8KFdcXGRcXGQtXFxkKXwoXFxkXFxkXFxkKSkoKFR8ICkoXFxkXFxkKDpcXGRcXGQoOlxcZFxcZChcXC5cXGQrKT8pPyk/KT8oW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPyQvLFxyXG5cclxuICAgICAgICBpc29Gb3JtYXQgPSAnWVlZWS1NTS1ERFRISDptbTpzc1onLFxyXG5cclxuICAgICAgICBpc29EYXRlcyA9IFtcclxuICAgICAgICAgICAgWydZWVlZWVktTU0tREQnLCAvWystXVxcZHs2fS1cXGR7Mn0tXFxkezJ9L10sXHJcbiAgICAgICAgICAgIFsnWVlZWS1NTS1ERCcsIC9cXGR7NH0tXFxkezJ9LVxcZHsyfS9dLFxyXG4gICAgICAgICAgICBbJ0dHR0ctW1ddV1ctRScsIC9cXGR7NH0tV1xcZHsyfS1cXGQvXSxcclxuICAgICAgICAgICAgWydHR0dHLVtXXVdXJywgL1xcZHs0fS1XXFxkezJ9L10sXHJcbiAgICAgICAgICAgIFsnWVlZWS1EREQnLCAvXFxkezR9LVxcZHszfS9dXHJcbiAgICAgICAgXSxcclxuXHJcbiAgICAgICAgLy8gaXNvIHRpbWUgZm9ybWF0cyBhbmQgcmVnZXhlc1xyXG4gICAgICAgIGlzb1RpbWVzID0gW1xyXG4gICAgICAgICAgICBbJ0hIOm1tOnNzLlNTU1MnLCAvKFR8IClcXGRcXGQ6XFxkXFxkOlxcZFxcZFxcLlxcZCsvXSxcclxuICAgICAgICAgICAgWydISDptbTpzcycsIC8oVHwgKVxcZFxcZDpcXGRcXGQ6XFxkXFxkL10sXHJcbiAgICAgICAgICAgIFsnSEg6bW0nLCAvKFR8IClcXGRcXGQ6XFxkXFxkL10sXHJcbiAgICAgICAgICAgIFsnSEgnLCAvKFR8IClcXGRcXGQvXVxyXG4gICAgICAgIF0sXHJcblxyXG4gICAgICAgIC8vIHRpbWV6b25lIGNodW5rZXIgXCIrMTA6MDBcIiA+IFtcIjEwXCIsIFwiMDBcIl0gb3IgXCItMTUzMFwiID4gW1wiLTE1XCIsIFwiMzBcIl1cclxuICAgICAgICBwYXJzZVRpbWV6b25lQ2h1bmtlciA9IC8oW1xcK1xcLV18XFxkXFxkKS9naSxcclxuXHJcbiAgICAgICAgLy8gZ2V0dGVyIGFuZCBzZXR0ZXIgbmFtZXNcclxuICAgICAgICBwcm94eUdldHRlcnNBbmRTZXR0ZXJzID0gJ0RhdGV8SG91cnN8TWludXRlc3xTZWNvbmRzfE1pbGxpc2Vjb25kcycuc3BsaXQoJ3wnKSxcclxuICAgICAgICB1bml0TWlsbGlzZWNvbmRGYWN0b3JzID0ge1xyXG4gICAgICAgICAgICAnTWlsbGlzZWNvbmRzJyA6IDEsXHJcbiAgICAgICAgICAgICdTZWNvbmRzJyA6IDFlMyxcclxuICAgICAgICAgICAgJ01pbnV0ZXMnIDogNmU0LFxyXG4gICAgICAgICAgICAnSG91cnMnIDogMzZlNSxcclxuICAgICAgICAgICAgJ0RheXMnIDogODY0ZTUsXHJcbiAgICAgICAgICAgICdNb250aHMnIDogMjU5MmU2LFxyXG4gICAgICAgICAgICAnWWVhcnMnIDogMzE1MzZlNlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHVuaXRBbGlhc2VzID0ge1xyXG4gICAgICAgICAgICBtcyA6ICdtaWxsaXNlY29uZCcsXHJcbiAgICAgICAgICAgIHMgOiAnc2Vjb25kJyxcclxuICAgICAgICAgICAgbSA6ICdtaW51dGUnLFxyXG4gICAgICAgICAgICBoIDogJ2hvdXInLFxyXG4gICAgICAgICAgICBkIDogJ2RheScsXHJcbiAgICAgICAgICAgIEQgOiAnZGF0ZScsXHJcbiAgICAgICAgICAgIHcgOiAnd2VlaycsXHJcbiAgICAgICAgICAgIFcgOiAnaXNvV2VlaycsXHJcbiAgICAgICAgICAgIE0gOiAnbW9udGgnLFxyXG4gICAgICAgICAgICBRIDogJ3F1YXJ0ZXInLFxyXG4gICAgICAgICAgICB5IDogJ3llYXInLFxyXG4gICAgICAgICAgICBEREQgOiAnZGF5T2ZZZWFyJyxcclxuICAgICAgICAgICAgZSA6ICd3ZWVrZGF5JyxcclxuICAgICAgICAgICAgRSA6ICdpc29XZWVrZGF5JyxcclxuICAgICAgICAgICAgZ2c6ICd3ZWVrWWVhcicsXHJcbiAgICAgICAgICAgIEdHOiAnaXNvV2Vla1llYXInXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY2FtZWxGdW5jdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGRheW9meWVhciA6ICdkYXlPZlllYXInLFxyXG4gICAgICAgICAgICBpc293ZWVrZGF5IDogJ2lzb1dlZWtkYXknLFxyXG4gICAgICAgICAgICBpc293ZWVrIDogJ2lzb1dlZWsnLFxyXG4gICAgICAgICAgICB3ZWVreWVhciA6ICd3ZWVrWWVhcicsXHJcbiAgICAgICAgICAgIGlzb3dlZWt5ZWFyIDogJ2lzb1dlZWtZZWFyJ1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIGZvcm1hdCBmdW5jdGlvbiBzdHJpbmdzXHJcbiAgICAgICAgZm9ybWF0RnVuY3Rpb25zID0ge30sXHJcblxyXG4gICAgICAgIC8vIGRlZmF1bHQgcmVsYXRpdmUgdGltZSB0aHJlc2hvbGRzXHJcbiAgICAgICAgcmVsYXRpdmVUaW1lVGhyZXNob2xkcyA9IHtcclxuICAgICAgICAgIHM6IDQ1LCAgIC8vc2Vjb25kcyB0byBtaW51dGVzXHJcbiAgICAgICAgICBtOiA0NSwgICAvL21pbnV0ZXMgdG8gaG91cnNcclxuICAgICAgICAgIGg6IDIyLCAgIC8vaG91cnMgdG8gZGF5c1xyXG4gICAgICAgICAgZGQ6IDI1LCAgLy9kYXlzIHRvIG1vbnRoIChtb250aCA9PSAxKVxyXG4gICAgICAgICAgZG06IDQ1LCAgLy9kYXlzIHRvIG1vbnRocyAobW9udGhzID4gMSlcclxuICAgICAgICAgIGR5OiAzNDUgIC8vZGF5cyB0byB5ZWFyXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8gdG9rZW5zIHRvIG9yZGluYWxpemUgYW5kIHBhZFxyXG4gICAgICAgIG9yZGluYWxpemVUb2tlbnMgPSAnREREIHcgVyBNIEQgZCcuc3BsaXQoJyAnKSxcclxuICAgICAgICBwYWRkZWRUb2tlbnMgPSAnTSBEIEggaCBtIHMgdyBXJy5zcGxpdCgnICcpLFxyXG5cclxuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9ucyA9IHtcclxuICAgICAgICAgICAgTSAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1vbnRoKCkgKyAxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBNTU0gIDogZnVuY3Rpb24gKGZvcm1hdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLm1vbnRoc1Nob3J0KHRoaXMsIGZvcm1hdCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIE1NTU0gOiBmdW5jdGlvbiAoZm9ybWF0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubW9udGhzKHRoaXMsIGZvcm1hdCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEQgICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRlKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIERERCAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYXlPZlllYXIoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZCAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRheSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBkZCAgIDogZnVuY3Rpb24gKGZvcm1hdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLndlZWtkYXlzTWluKHRoaXMsIGZvcm1hdCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGRkZCAgOiBmdW5jdGlvbiAoZm9ybWF0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkud2Vla2RheXNTaG9ydCh0aGlzLCBmb3JtYXQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBkZGRkIDogZnVuY3Rpb24gKGZvcm1hdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLndlZWtkYXlzKHRoaXMsIGZvcm1hdCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHcgICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53ZWVrKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFcgICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc29XZWVrKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFlZICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMueWVhcigpICUgMTAwLCAyKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgWVlZWSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy55ZWFyKCksIDQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBZWVlZWSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy55ZWFyKCksIDUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBZWVlZWVkgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMueWVhcigpLCBzaWduID0geSA+PSAwID8gJysnIDogJy0nO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpZ24gKyBsZWZ0WmVyb0ZpbGwoTWF0aC5hYnMoeSksIDYpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBnZyAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLndlZWtZZWFyKCkgJSAxMDAsIDIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBnZ2dnIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLndlZWtZZWFyKCksIDQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBnZ2dnZyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy53ZWVrWWVhcigpLCA1KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR0cgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5pc29XZWVrWWVhcigpICUgMTAwLCAyKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR0dHRyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5pc29XZWVrWWVhcigpLCA0KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR0dHR0cgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMuaXNvV2Vla1llYXIoKSwgNSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGUgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53ZWVrZGF5KCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEUgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc29XZWVrZGF5KCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGEgICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEEgICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBIICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaG91cnMoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaCAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhvdXJzKCkgJSAxMiB8fCAxMjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbSAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1pbnV0ZXMoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcyAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlY29uZHMoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUyAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0b0ludCh0aGlzLm1pbGxpc2Vjb25kcygpIC8gMTAwKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgU1MgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodG9JbnQodGhpcy5taWxsaXNlY29uZHMoKSAvIDEwKSwgMik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFNTUyAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMubWlsbGlzZWNvbmRzKCksIDMpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBTU1NTIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLm1pbGxpc2Vjb25kcygpLCAzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgWiAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gLXRoaXMuem9uZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgIGIgPSBcIitcIjtcclxuICAgICAgICAgICAgICAgIGlmIChhIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGEgPSAtYTtcclxuICAgICAgICAgICAgICAgICAgICBiID0gXCItXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYiArIGxlZnRaZXJvRmlsbCh0b0ludChhIC8gNjApLCAyKSArIFwiOlwiICsgbGVmdFplcm9GaWxsKHRvSW50KGEpICUgNjAsIDIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBaWiAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSAtdGhpcy56b25lKCksXHJcbiAgICAgICAgICAgICAgICAgICAgYiA9IFwiK1wiO1xyXG4gICAgICAgICAgICAgICAgaWYgKGEgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYSA9IC1hO1xyXG4gICAgICAgICAgICAgICAgICAgIGIgPSBcIi1cIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiICsgbGVmdFplcm9GaWxsKHRvSW50KGEgLyA2MCksIDIpICsgbGVmdFplcm9GaWxsKHRvSW50KGEpICUgNjAsIDIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB6IDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuem9uZUFiYnIoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgenogOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy56b25lTmFtZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBYICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudW5peCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBRIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVhcnRlcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbGlzdHMgPSBbJ21vbnRocycsICdtb250aHNTaG9ydCcsICd3ZWVrZGF5cycsICd3ZWVrZGF5c1Nob3J0JywgJ3dlZWtkYXlzTWluJ107XHJcblxyXG4gICAgLy8gUGljayB0aGUgZmlyc3QgZGVmaW5lZCBvZiB0d28gb3IgdGhyZWUgYXJndW1lbnRzLiBkZmwgY29tZXMgZnJvbVxyXG4gICAgLy8gZGVmYXVsdC5cclxuICAgIGZ1bmN0aW9uIGRmbChhLCBiLCBjKSB7XHJcbiAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMjogcmV0dXJuIGEgIT0gbnVsbCA/IGEgOiBiO1xyXG4gICAgICAgICAgICBjYXNlIDM6IHJldHVybiBhICE9IG51bGwgPyBhIDogYiAhPSBudWxsID8gYiA6IGM7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihcIkltcGxlbWVudCBtZVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVmYXVsdFBhcnNpbmdGbGFncygpIHtcclxuICAgICAgICAvLyBXZSBuZWVkIHRvIGRlZXAgY2xvbmUgdGhpcyBvYmplY3QsIGFuZCBlczUgc3RhbmRhcmQgaXMgbm90IHZlcnlcclxuICAgICAgICAvLyBoZWxwZnVsLlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGVtcHR5IDogZmFsc2UsXHJcbiAgICAgICAgICAgIHVudXNlZFRva2VucyA6IFtdLFxyXG4gICAgICAgICAgICB1bnVzZWRJbnB1dCA6IFtdLFxyXG4gICAgICAgICAgICBvdmVyZmxvdyA6IC0yLFxyXG4gICAgICAgICAgICBjaGFyc0xlZnRPdmVyIDogMCxcclxuICAgICAgICAgICAgbnVsbElucHV0IDogZmFsc2UsXHJcbiAgICAgICAgICAgIGludmFsaWRNb250aCA6IG51bGwsXHJcbiAgICAgICAgICAgIGludmFsaWRGb3JtYXQgOiBmYWxzZSxcclxuICAgICAgICAgICAgdXNlckludmFsaWRhdGVkIDogZmFsc2UsXHJcbiAgICAgICAgICAgIGlzbzogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlcHJlY2F0ZShtc2csIGZuKSB7XHJcbiAgICAgICAgdmFyIGZpcnN0VGltZSA9IHRydWU7XHJcbiAgICAgICAgZnVuY3Rpb24gcHJpbnRNc2coKSB7XHJcbiAgICAgICAgICAgIGlmIChtb21lbnQuc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID09PSBmYWxzZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBjb25zb2xlLndhcm4pIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkRlcHJlY2F0aW9uIHdhcm5pbmc6IFwiICsgbXNnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZXh0ZW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKGZpcnN0VGltZSkge1xyXG4gICAgICAgICAgICAgICAgcHJpbnRNc2coKTtcclxuICAgICAgICAgICAgICAgIGZpcnN0VGltZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH0sIGZuKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYWRUb2tlbihmdW5jLCBjb3VudCkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKGZ1bmMuY2FsbCh0aGlzLCBhKSwgY291bnQpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBvcmRpbmFsaXplVG9rZW4oZnVuYywgcGVyaW9kKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5vcmRpbmFsKGZ1bmMuY2FsbCh0aGlzLCBhKSwgcGVyaW9kKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHdoaWxlIChvcmRpbmFsaXplVG9rZW5zLmxlbmd0aCkge1xyXG4gICAgICAgIGkgPSBvcmRpbmFsaXplVG9rZW5zLnBvcCgpO1xyXG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW2kgKyAnbyddID0gb3JkaW5hbGl6ZVRva2VuKGZvcm1hdFRva2VuRnVuY3Rpb25zW2ldLCBpKTtcclxuICAgIH1cclxuICAgIHdoaWxlIChwYWRkZWRUb2tlbnMubGVuZ3RoKSB7XHJcbiAgICAgICAgaSA9IHBhZGRlZFRva2Vucy5wb3AoKTtcclxuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1tpICsgaV0gPSBwYWRUb2tlbihmb3JtYXRUb2tlbkZ1bmN0aW9uc1tpXSwgMik7XHJcbiAgICB9XHJcbiAgICBmb3JtYXRUb2tlbkZ1bmN0aW9ucy5EREREID0gcGFkVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnMuRERELCAzKTtcclxuXHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIENvbnN0cnVjdG9yc1xyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICAgIGZ1bmN0aW9uIExhbmd1YWdlKCkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLyBNb21lbnQgcHJvdG90eXBlIG9iamVjdFxyXG4gICAgZnVuY3Rpb24gTW9tZW50KGNvbmZpZykge1xyXG4gICAgICAgIGNoZWNrT3ZlcmZsb3coY29uZmlnKTtcclxuICAgICAgICBleHRlbmQodGhpcywgY29uZmlnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEdXJhdGlvbiBDb25zdHJ1Y3RvclxyXG4gICAgZnVuY3Rpb24gRHVyYXRpb24oZHVyYXRpb24pIHtcclxuICAgICAgICB2YXIgbm9ybWFsaXplZElucHV0ID0gbm9ybWFsaXplT2JqZWN0VW5pdHMoZHVyYXRpb24pLFxyXG4gICAgICAgICAgICB5ZWFycyA9IG5vcm1hbGl6ZWRJbnB1dC55ZWFyIHx8IDAsXHJcbiAgICAgICAgICAgIHF1YXJ0ZXJzID0gbm9ybWFsaXplZElucHV0LnF1YXJ0ZXIgfHwgMCxcclxuICAgICAgICAgICAgbW9udGhzID0gbm9ybWFsaXplZElucHV0Lm1vbnRoIHx8IDAsXHJcbiAgICAgICAgICAgIHdlZWtzID0gbm9ybWFsaXplZElucHV0LndlZWsgfHwgMCxcclxuICAgICAgICAgICAgZGF5cyA9IG5vcm1hbGl6ZWRJbnB1dC5kYXkgfHwgMCxcclxuICAgICAgICAgICAgaG91cnMgPSBub3JtYWxpemVkSW5wdXQuaG91ciB8fCAwLFxyXG4gICAgICAgICAgICBtaW51dGVzID0gbm9ybWFsaXplZElucHV0Lm1pbnV0ZSB8fCAwLFxyXG4gICAgICAgICAgICBzZWNvbmRzID0gbm9ybWFsaXplZElucHV0LnNlY29uZCB8fCAwLFxyXG4gICAgICAgICAgICBtaWxsaXNlY29uZHMgPSBub3JtYWxpemVkSW5wdXQubWlsbGlzZWNvbmQgfHwgMDtcclxuXHJcbiAgICAgICAgLy8gcmVwcmVzZW50YXRpb24gZm9yIGRhdGVBZGRSZW1vdmVcclxuICAgICAgICB0aGlzLl9taWxsaXNlY29uZHMgPSArbWlsbGlzZWNvbmRzICtcclxuICAgICAgICAgICAgc2Vjb25kcyAqIDFlMyArIC8vIDEwMDBcclxuICAgICAgICAgICAgbWludXRlcyAqIDZlNCArIC8vIDEwMDAgKiA2MFxyXG4gICAgICAgICAgICBob3VycyAqIDM2ZTU7IC8vIDEwMDAgKiA2MCAqIDYwXHJcbiAgICAgICAgLy8gQmVjYXVzZSBvZiBkYXRlQWRkUmVtb3ZlIHRyZWF0cyAyNCBob3VycyBhcyBkaWZmZXJlbnQgZnJvbSBhXHJcbiAgICAgICAgLy8gZGF5IHdoZW4gd29ya2luZyBhcm91bmQgRFNULCB3ZSBuZWVkIHRvIHN0b3JlIHRoZW0gc2VwYXJhdGVseVxyXG4gICAgICAgIHRoaXMuX2RheXMgPSArZGF5cyArXHJcbiAgICAgICAgICAgIHdlZWtzICogNztcclxuICAgICAgICAvLyBJdCBpcyBpbXBvc3NpYmxlIHRyYW5zbGF0ZSBtb250aHMgaW50byBkYXlzIHdpdGhvdXQga25vd2luZ1xyXG4gICAgICAgIC8vIHdoaWNoIG1vbnRocyB5b3UgYXJlIGFyZSB0YWxraW5nIGFib3V0LCBzbyB3ZSBoYXZlIHRvIHN0b3JlXHJcbiAgICAgICAgLy8gaXQgc2VwYXJhdGVseS5cclxuICAgICAgICB0aGlzLl9tb250aHMgPSArbW9udGhzICtcclxuICAgICAgICAgICAgcXVhcnRlcnMgKiAzICtcclxuICAgICAgICAgICAgeWVhcnMgKiAxMjtcclxuXHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLl9idWJibGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgSGVscGVyc1xyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBleHRlbmQoYSwgYikge1xyXG4gICAgICAgIGZvciAodmFyIGkgaW4gYikge1xyXG4gICAgICAgICAgICBpZiAoYi5oYXNPd25Qcm9wZXJ0eShpKSkge1xyXG4gICAgICAgICAgICAgICAgYVtpXSA9IGJbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChiLmhhc093blByb3BlcnR5KFwidG9TdHJpbmdcIikpIHtcclxuICAgICAgICAgICAgYS50b1N0cmluZyA9IGIudG9TdHJpbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYi5oYXNPd25Qcm9wZXJ0eShcInZhbHVlT2ZcIikpIHtcclxuICAgICAgICAgICAgYS52YWx1ZU9mID0gYi52YWx1ZU9mO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGE7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xvbmVNb21lbnQobSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB7fSwgaTtcclxuICAgICAgICBmb3IgKGkgaW4gbSkge1xyXG4gICAgICAgICAgICBpZiAobS5oYXNPd25Qcm9wZXJ0eShpKSAmJiBtb21lbnRQcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KGkpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRbaV0gPSBtW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFic1JvdW5kKG51bWJlcikge1xyXG4gICAgICAgIGlmIChudW1iZXIgPCAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBsZWZ0IHplcm8gZmlsbCBhIG51bWJlclxyXG4gICAgLy8gc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2xlZnQtemVyby1maWxsaW5nIGZvciBwZXJmb3JtYW5jZSBjb21wYXJpc29uXHJcbiAgICBmdW5jdGlvbiBsZWZ0WmVyb0ZpbGwobnVtYmVyLCB0YXJnZXRMZW5ndGgsIGZvcmNlU2lnbikge1xyXG4gICAgICAgIHZhciBvdXRwdXQgPSAnJyArIE1hdGguYWJzKG51bWJlciksXHJcbiAgICAgICAgICAgIHNpZ24gPSBudW1iZXIgPj0gMDtcclxuXHJcbiAgICAgICAgd2hpbGUgKG91dHB1dC5sZW5ndGggPCB0YXJnZXRMZW5ndGgpIHtcclxuICAgICAgICAgICAgb3V0cHV0ID0gJzAnICsgb3V0cHV0O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKHNpZ24gPyAoZm9yY2VTaWduID8gJysnIDogJycpIDogJy0nKSArIG91dHB1dDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBoZWxwZXIgZnVuY3Rpb24gZm9yIF8uYWRkVGltZSBhbmQgXy5zdWJ0cmFjdFRpbWVcclxuICAgIGZ1bmN0aW9uIGFkZE9yU3VidHJhY3REdXJhdGlvbkZyb21Nb21lbnQobW9tLCBkdXJhdGlvbiwgaXNBZGRpbmcsIHVwZGF0ZU9mZnNldCkge1xyXG4gICAgICAgIHZhciBtaWxsaXNlY29uZHMgPSBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzLFxyXG4gICAgICAgICAgICBkYXlzID0gZHVyYXRpb24uX2RheXMsXHJcbiAgICAgICAgICAgIG1vbnRocyA9IGR1cmF0aW9uLl9tb250aHM7XHJcbiAgICAgICAgdXBkYXRlT2Zmc2V0ID0gdXBkYXRlT2Zmc2V0ID09IG51bGwgPyB0cnVlIDogdXBkYXRlT2Zmc2V0O1xyXG5cclxuICAgICAgICBpZiAobWlsbGlzZWNvbmRzKSB7XHJcbiAgICAgICAgICAgIG1vbS5fZC5zZXRUaW1lKCttb20uX2QgKyBtaWxsaXNlY29uZHMgKiBpc0FkZGluZyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkYXlzKSB7XHJcbiAgICAgICAgICAgIHJhd1NldHRlcihtb20sICdEYXRlJywgcmF3R2V0dGVyKG1vbSwgJ0RhdGUnKSArIGRheXMgKiBpc0FkZGluZyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtb250aHMpIHtcclxuICAgICAgICAgICAgcmF3TW9udGhTZXR0ZXIobW9tLCByYXdHZXR0ZXIobW9tLCAnTW9udGgnKSArIG1vbnRocyAqIGlzQWRkaW5nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHVwZGF0ZU9mZnNldCkge1xyXG4gICAgICAgICAgICBtb21lbnQudXBkYXRlT2Zmc2V0KG1vbSwgZGF5cyB8fCBtb250aHMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBjaGVjayBpZiBpcyBhbiBhcnJheVxyXG4gICAgZnVuY3Rpb24gaXNBcnJheShpbnB1dCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBBcnJheV0nO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzRGF0ZShpbnB1dCkge1xyXG4gICAgICAgIHJldHVybiAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgRGF0ZV0nIHx8XHJcbiAgICAgICAgICAgICAgICBpbnB1dCBpbnN0YW5jZW9mIERhdGU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29tcGFyZSB0d28gYXJyYXlzLCByZXR1cm4gdGhlIG51bWJlciBvZiBkaWZmZXJlbmNlc1xyXG4gICAgZnVuY3Rpb24gY29tcGFyZUFycmF5cyhhcnJheTEsIGFycmF5MiwgZG9udENvbnZlcnQpIHtcclxuICAgICAgICB2YXIgbGVuID0gTWF0aC5taW4oYXJyYXkxLmxlbmd0aCwgYXJyYXkyLmxlbmd0aCksXHJcbiAgICAgICAgICAgIGxlbmd0aERpZmYgPSBNYXRoLmFicyhhcnJheTEubGVuZ3RoIC0gYXJyYXkyLmxlbmd0aCksXHJcbiAgICAgICAgICAgIGRpZmZzID0gMCxcclxuICAgICAgICAgICAgaTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKChkb250Q29udmVydCAmJiBhcnJheTFbaV0gIT09IGFycmF5MltpXSkgfHxcclxuICAgICAgICAgICAgICAgICghZG9udENvbnZlcnQgJiYgdG9JbnQoYXJyYXkxW2ldKSAhPT0gdG9JbnQoYXJyYXkyW2ldKSkpIHtcclxuICAgICAgICAgICAgICAgIGRpZmZzKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRpZmZzICsgbGVuZ3RoRGlmZjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBub3JtYWxpemVVbml0cyh1bml0cykge1xyXG4gICAgICAgIGlmICh1bml0cykge1xyXG4gICAgICAgICAgICB2YXIgbG93ZXJlZCA9IHVuaXRzLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvKC4pcyQvLCAnJDEnKTtcclxuICAgICAgICAgICAgdW5pdHMgPSB1bml0QWxpYXNlc1t1bml0c10gfHwgY2FtZWxGdW5jdGlvbnNbbG93ZXJlZF0gfHwgbG93ZXJlZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuaXRzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZU9iamVjdFVuaXRzKGlucHV0T2JqZWN0KSB7XHJcbiAgICAgICAgdmFyIG5vcm1hbGl6ZWRJbnB1dCA9IHt9LFxyXG4gICAgICAgICAgICBub3JtYWxpemVkUHJvcCxcclxuICAgICAgICAgICAgcHJvcDtcclxuXHJcbiAgICAgICAgZm9yIChwcm9wIGluIGlucHV0T2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGlmIChpbnB1dE9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgbm9ybWFsaXplZFByb3AgPSBub3JtYWxpemVVbml0cyhwcm9wKTtcclxuICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkUHJvcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dFtub3JtYWxpemVkUHJvcF0gPSBpbnB1dE9iamVjdFtwcm9wXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWRJbnB1dDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlTGlzdChmaWVsZCkge1xyXG4gICAgICAgIHZhciBjb3VudCwgc2V0dGVyO1xyXG5cclxuICAgICAgICBpZiAoZmllbGQuaW5kZXhPZignd2VlaycpID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvdW50ID0gNztcclxuICAgICAgICAgICAgc2V0dGVyID0gJ2RheSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGZpZWxkLmluZGV4T2YoJ21vbnRoJykgPT09IDApIHtcclxuICAgICAgICAgICAgY291bnQgPSAxMjtcclxuICAgICAgICAgICAgc2V0dGVyID0gJ21vbnRoJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1vbWVudFtmaWVsZF0gPSBmdW5jdGlvbiAoZm9ybWF0LCBpbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgaSwgZ2V0dGVyLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kID0gbW9tZW50LmZuLl9sYW5nW2ZpZWxkXSxcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybWF0ID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgaW5kZXggPSBmb3JtYXQ7XHJcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdldHRlciA9IGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbSA9IG1vbWVudCgpLnV0YygpLnNldChzZXR0ZXIsIGkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1ldGhvZC5jYWxsKG1vbWVudC5mbi5fbGFuZywgbSwgZm9ybWF0IHx8ICcnKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbmRleCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0dGVyKGluZGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGdldHRlcihpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdG9JbnQoYXJndW1lbnRGb3JDb2VyY2lvbikge1xyXG4gICAgICAgIHZhciBjb2VyY2VkTnVtYmVyID0gK2FyZ3VtZW50Rm9yQ29lcmNpb24sXHJcbiAgICAgICAgICAgIHZhbHVlID0gMDtcclxuXHJcbiAgICAgICAgaWYgKGNvZXJjZWROdW1iZXIgIT09IDAgJiYgaXNGaW5pdGUoY29lcmNlZE51bWJlcikpIHtcclxuICAgICAgICAgICAgaWYgKGNvZXJjZWROdW1iZXIgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBNYXRoLmZsb29yKGNvZXJjZWROdW1iZXIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBNYXRoLmNlaWwoY29lcmNlZE51bWJlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkYXlzSW5Nb250aCh5ZWFyLCBtb250aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCArIDEsIDApKS5nZXRVVENEYXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gd2Vla3NJblllYXIoeWVhciwgZG93LCBkb3kpIHtcclxuICAgICAgICByZXR1cm4gd2Vla09mWWVhcihtb21lbnQoW3llYXIsIDExLCAzMSArIGRvdyAtIGRveV0pLCBkb3csIGRveSkud2VlaztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkYXlzSW5ZZWFyKHllYXIpIHtcclxuICAgICAgICByZXR1cm4gaXNMZWFwWWVhcih5ZWFyKSA/IDM2NiA6IDM2NTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc0xlYXBZZWFyKHllYXIpIHtcclxuICAgICAgICByZXR1cm4gKHllYXIgJSA0ID09PSAwICYmIHllYXIgJSAxMDAgIT09IDApIHx8IHllYXIgJSA0MDAgPT09IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2hlY2tPdmVyZmxvdyhtKSB7XHJcbiAgICAgICAgdmFyIG92ZXJmbG93O1xyXG4gICAgICAgIGlmIChtLl9hICYmIG0uX3BmLm92ZXJmbG93ID09PSAtMikge1xyXG4gICAgICAgICAgICBvdmVyZmxvdyA9XHJcbiAgICAgICAgICAgICAgICBtLl9hW01PTlRIXSA8IDAgfHwgbS5fYVtNT05USF0gPiAxMSA/IE1PTlRIIDpcclxuICAgICAgICAgICAgICAgIG0uX2FbREFURV0gPCAxIHx8IG0uX2FbREFURV0gPiBkYXlzSW5Nb250aChtLl9hW1lFQVJdLCBtLl9hW01PTlRIXSkgPyBEQVRFIDpcclxuICAgICAgICAgICAgICAgIG0uX2FbSE9VUl0gPCAwIHx8IG0uX2FbSE9VUl0gPiAyMyA/IEhPVVIgOlxyXG4gICAgICAgICAgICAgICAgbS5fYVtNSU5VVEVdIDwgMCB8fCBtLl9hW01JTlVURV0gPiA1OSA/IE1JTlVURSA6XHJcbiAgICAgICAgICAgICAgICBtLl9hW1NFQ09ORF0gPCAwIHx8IG0uX2FbU0VDT05EXSA+IDU5ID8gU0VDT05EIDpcclxuICAgICAgICAgICAgICAgIG0uX2FbTUlMTElTRUNPTkRdIDwgMCB8fCBtLl9hW01JTExJU0VDT05EXSA+IDk5OSA/IE1JTExJU0VDT05EIDpcclxuICAgICAgICAgICAgICAgIC0xO1xyXG5cclxuICAgICAgICAgICAgaWYgKG0uX3BmLl9vdmVyZmxvd0RheU9mWWVhciAmJiAob3ZlcmZsb3cgPCBZRUFSIHx8IG92ZXJmbG93ID4gREFURSkpIHtcclxuICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gREFURTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbS5fcGYub3ZlcmZsb3cgPSBvdmVyZmxvdztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNWYWxpZChtKSB7XHJcbiAgICAgICAgaWYgKG0uX2lzVmFsaWQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBtLl9pc1ZhbGlkID0gIWlzTmFOKG0uX2QuZ2V0VGltZSgpKSAmJlxyXG4gICAgICAgICAgICAgICAgbS5fcGYub3ZlcmZsb3cgPCAwICYmXHJcbiAgICAgICAgICAgICAgICAhbS5fcGYuZW1wdHkgJiZcclxuICAgICAgICAgICAgICAgICFtLl9wZi5pbnZhbGlkTW9udGggJiZcclxuICAgICAgICAgICAgICAgICFtLl9wZi5udWxsSW5wdXQgJiZcclxuICAgICAgICAgICAgICAgICFtLl9wZi5pbnZhbGlkRm9ybWF0ICYmXHJcbiAgICAgICAgICAgICAgICAhbS5fcGYudXNlckludmFsaWRhdGVkO1xyXG5cclxuICAgICAgICAgICAgaWYgKG0uX3N0cmljdCkge1xyXG4gICAgICAgICAgICAgICAgbS5faXNWYWxpZCA9IG0uX2lzVmFsaWQgJiZcclxuICAgICAgICAgICAgICAgICAgICBtLl9wZi5jaGFyc0xlZnRPdmVyID09PSAwICYmXHJcbiAgICAgICAgICAgICAgICAgICAgbS5fcGYudW51c2VkVG9rZW5zLmxlbmd0aCA9PT0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbS5faXNWYWxpZDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBub3JtYWxpemVMYW5ndWFnZShrZXkpIHtcclxuICAgICAgICByZXR1cm4ga2V5ID8ga2V5LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnXycsICctJykgOiBrZXk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmV0dXJuIGEgbW9tZW50IGZyb20gaW5wdXQsIHRoYXQgaXMgbG9jYWwvdXRjL3pvbmUgZXF1aXZhbGVudCB0byBtb2RlbC5cclxuICAgIGZ1bmN0aW9uIG1ha2VBcyhpbnB1dCwgbW9kZWwpIHtcclxuICAgICAgICByZXR1cm4gbW9kZWwuX2lzVVRDID8gbW9tZW50KGlucHV0KS56b25lKG1vZGVsLl9vZmZzZXQgfHwgMCkgOlxyXG4gICAgICAgICAgICBtb21lbnQoaW5wdXQpLmxvY2FsKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIExhbmd1YWdlc1xyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgICBleHRlbmQoTGFuZ3VhZ2UucHJvdG90eXBlLCB7XHJcblxyXG4gICAgICAgIHNldCA6IGZ1bmN0aW9uIChjb25maWcpIHtcclxuICAgICAgICAgICAgdmFyIHByb3AsIGk7XHJcbiAgICAgICAgICAgIGZvciAoaSBpbiBjb25maWcpIHtcclxuICAgICAgICAgICAgICAgIHByb3AgPSBjb25maWdbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHByb3AgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzW2ldID0gcHJvcDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc1snXycgKyBpXSA9IHByb3A7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfbW9udGhzIDogXCJKYW51YXJ5X0ZlYnJ1YXJ5X01hcmNoX0FwcmlsX01heV9KdW5lX0p1bHlfQXVndXN0X1NlcHRlbWJlcl9PY3RvYmVyX05vdmVtYmVyX0RlY2VtYmVyXCIuc3BsaXQoXCJfXCIpLFxyXG4gICAgICAgIG1vbnRocyA6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNbbS5tb250aCgpXTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfbW9udGhzU2hvcnQgOiBcIkphbl9GZWJfTWFyX0Fwcl9NYXlfSnVuX0p1bF9BdWdfU2VwX09jdF9Ob3ZfRGVjXCIuc3BsaXQoXCJfXCIpLFxyXG4gICAgICAgIG1vbnRoc1Nob3J0IDogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0W20ubW9udGgoKV07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbW9udGhzUGFyc2UgOiBmdW5jdGlvbiAobW9udGhOYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBpLCBtb20sIHJlZ2V4O1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW9udGhzUGFyc2UgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZVtpXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vbSA9IG1vbWVudC51dGMoWzIwMDAsIGldKTtcclxuICAgICAgICAgICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMubW9udGhzKG1vbSwgJycpICsgJ3xeJyArIHRoaXMubW9udGhzU2hvcnQobW9tLCAnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKHJlZ2V4LnJlcGxhY2UoJy4nLCAnJyksICdpJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyB0ZXN0IHRoZSByZWdleFxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX21vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX3dlZWtkYXlzIDogXCJTdW5kYXlfTW9uZGF5X1R1ZXNkYXlfV2VkbmVzZGF5X1RodXJzZGF5X0ZyaWRheV9TYXR1cmRheVwiLnNwbGl0KFwiX1wiKSxcclxuICAgICAgICB3ZWVrZGF5cyA6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1ttLmRheSgpXTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfd2Vla2RheXNTaG9ydCA6IFwiU3VuX01vbl9UdWVfV2VkX1RodV9GcmlfU2F0XCIuc3BsaXQoXCJfXCIpLFxyXG4gICAgICAgIHdlZWtkYXlzU2hvcnQgOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTaG9ydFttLmRheSgpXTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfd2Vla2RheXNNaW4gOiBcIlN1X01vX1R1X1dlX1RoX0ZyX1NhXCIuc3BsaXQoXCJfXCIpLFxyXG4gICAgICAgIHdlZWtkYXlzTWluIDogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluW20uZGF5KCldO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHdlZWtkYXlzUGFyc2UgOiBmdW5jdGlvbiAod2Vla2RheU5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGksIG1vbSwgcmVnZXg7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2UpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2UgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2VbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBtb20gPSBtb21lbnQoWzIwMDAsIDFdKS5kYXkoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLndlZWtkYXlzKG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKSArICd8XicgKyB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKHJlZ2V4LnJlcGxhY2UoJy4nLCAnJyksICdpJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyB0ZXN0IHRoZSByZWdleFxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9sb25nRGF0ZUZvcm1hdCA6IHtcclxuICAgICAgICAgICAgTFQgOiBcImg6bW0gQVwiLFxyXG4gICAgICAgICAgICBMIDogXCJNTS9ERC9ZWVlZXCIsXHJcbiAgICAgICAgICAgIExMIDogXCJNTU1NIEQgWVlZWVwiLFxyXG4gICAgICAgICAgICBMTEwgOiBcIk1NTU0gRCBZWVlZIExUXCIsXHJcbiAgICAgICAgICAgIExMTEwgOiBcImRkZGQsIE1NTU0gRCBZWVlZIExUXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGxvbmdEYXRlRm9ybWF0IDogZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XTtcclxuICAgICAgICAgICAgaWYgKCFvdXRwdXQgJiYgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXkudG9VcHBlckNhc2UoKV0ucmVwbGFjZSgvTU1NTXxNTXxERHxkZGRkL2csIGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsLnNsaWNlKDEpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldID0gb3V0cHV0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNQTSA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICAvLyBJRTggUXVpcmtzIE1vZGUgJiBJRTcgU3RhbmRhcmRzIE1vZGUgZG8gbm90IGFsbG93IGFjY2Vzc2luZyBzdHJpbmdzIGxpa2UgYXJyYXlzXHJcbiAgICAgICAgICAgIC8vIFVzaW5nIGNoYXJBdCBzaG91bGQgYmUgbW9yZSBjb21wYXRpYmxlLlxyXG4gICAgICAgICAgICByZXR1cm4gKChpbnB1dCArICcnKS50b0xvd2VyQ2FzZSgpLmNoYXJBdCgwKSA9PT0gJ3AnKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfbWVyaWRpZW1QYXJzZSA6IC9bYXBdXFwuP20/XFwuPy9pLFxyXG4gICAgICAgIG1lcmlkaWVtIDogZnVuY3Rpb24gKGhvdXJzLCBtaW51dGVzLCBpc0xvd2VyKSB7XHJcbiAgICAgICAgICAgIGlmIChob3VycyA+IDExKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwbScgOiAnUE0nO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYW0nIDogJ0FNJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9jYWxlbmRhciA6IHtcclxuICAgICAgICAgICAgc2FtZURheSA6ICdbVG9kYXkgYXRdIExUJyxcclxuICAgICAgICAgICAgbmV4dERheSA6ICdbVG9tb3Jyb3cgYXRdIExUJyxcclxuICAgICAgICAgICAgbmV4dFdlZWsgOiAnZGRkZCBbYXRdIExUJyxcclxuICAgICAgICAgICAgbGFzdERheSA6ICdbWWVzdGVyZGF5IGF0XSBMVCcsXHJcbiAgICAgICAgICAgIGxhc3RXZWVrIDogJ1tMYXN0XSBkZGRkIFthdF0gTFQnLFxyXG4gICAgICAgICAgICBzYW1lRWxzZSA6ICdMJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FsZW5kYXIgOiBmdW5jdGlvbiAoa2V5LCBtb20pIHtcclxuICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX2NhbGVuZGFyW2tleV07XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2Ygb3V0cHV0ID09PSAnZnVuY3Rpb24nID8gb3V0cHV0LmFwcGx5KG1vbSkgOiBvdXRwdXQ7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX3JlbGF0aXZlVGltZSA6IHtcclxuICAgICAgICAgICAgZnV0dXJlIDogXCJpbiAlc1wiLFxyXG4gICAgICAgICAgICBwYXN0IDogXCIlcyBhZ29cIixcclxuICAgICAgICAgICAgcyA6IFwiYSBmZXcgc2Vjb25kc1wiLFxyXG4gICAgICAgICAgICBtIDogXCJhIG1pbnV0ZVwiLFxyXG4gICAgICAgICAgICBtbSA6IFwiJWQgbWludXRlc1wiLFxyXG4gICAgICAgICAgICBoIDogXCJhbiBob3VyXCIsXHJcbiAgICAgICAgICAgIGhoIDogXCIlZCBob3Vyc1wiLFxyXG4gICAgICAgICAgICBkIDogXCJhIGRheVwiLFxyXG4gICAgICAgICAgICBkZCA6IFwiJWQgZGF5c1wiLFxyXG4gICAgICAgICAgICBNIDogXCJhIG1vbnRoXCIsXHJcbiAgICAgICAgICAgIE1NIDogXCIlZCBtb250aHNcIixcclxuICAgICAgICAgICAgeSA6IFwiYSB5ZWFyXCIsXHJcbiAgICAgICAgICAgIHl5IDogXCIlZCB5ZWFyc1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICByZWxhdGl2ZVRpbWUgOiBmdW5jdGlvbiAobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSB7XHJcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9yZWxhdGl2ZVRpbWVbc3RyaW5nXTtcclxuICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygb3V0cHV0ID09PSAnZnVuY3Rpb24nKSA/XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSA6XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQucmVwbGFjZSgvJWQvaSwgbnVtYmVyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBhc3RGdXR1cmUgOiBmdW5jdGlvbiAoZGlmZiwgb3V0cHV0KSB7XHJcbiAgICAgICAgICAgIHZhciBmb3JtYXQgPSB0aGlzLl9yZWxhdGl2ZVRpbWVbZGlmZiA+IDAgPyAnZnV0dXJlJyA6ICdwYXN0J107XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZm9ybWF0ID09PSAnZnVuY3Rpb24nID8gZm9ybWF0KG91dHB1dCkgOiBmb3JtYXQucmVwbGFjZSgvJXMvaSwgb3V0cHV0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvcmRpbmFsIDogZnVuY3Rpb24gKG51bWJlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb3JkaW5hbC5yZXBsYWNlKFwiJWRcIiwgbnVtYmVyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9vcmRpbmFsIDogXCIlZFwiLFxyXG5cclxuICAgICAgICBwcmVwYXJzZSA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0cmluZztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwb3N0Zm9ybWF0IDogZnVuY3Rpb24gKHN0cmluZykge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RyaW5nO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHdlZWsgOiBmdW5jdGlvbiAobW9tKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3ZWVrT2ZZZWFyKG1vbSwgdGhpcy5fd2Vlay5kb3csIHRoaXMuX3dlZWsuZG95KS53ZWVrO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF93ZWVrIDoge1xyXG4gICAgICAgICAgICBkb3cgOiAwLCAvLyBTdW5kYXkgaXMgdGhlIGZpcnN0IGRheSBvZiB0aGUgd2Vlay5cclxuICAgICAgICAgICAgZG95IDogNiAgLy8gVGhlIHdlZWsgdGhhdCBjb250YWlucyBKYW4gMXN0IGlzIHRoZSBmaXJzdCB3ZWVrIG9mIHRoZSB5ZWFyLlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9pbnZhbGlkRGF0ZTogJ0ludmFsaWQgZGF0ZScsXHJcbiAgICAgICAgaW52YWxpZERhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ludmFsaWREYXRlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExvYWRzIGEgbGFuZ3VhZ2UgZGVmaW5pdGlvbiBpbnRvIHRoZSBgbGFuZ3VhZ2VzYCBjYWNoZS4gIFRoZSBmdW5jdGlvblxyXG4gICAgLy8gdGFrZXMgYSBrZXkgYW5kIG9wdGlvbmFsbHkgdmFsdWVzLiAgSWYgbm90IGluIHRoZSBicm93c2VyIGFuZCBubyB2YWx1ZXNcclxuICAgIC8vIGFyZSBwcm92aWRlZCwgaXQgd2lsbCBsb2FkIHRoZSBsYW5ndWFnZSBmaWxlIG1vZHVsZS4gIEFzIGEgY29udmVuaWVuY2UsXHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGFsc28gcmV0dXJucyB0aGUgbGFuZ3VhZ2UgdmFsdWVzLlxyXG4gICAgZnVuY3Rpb24gbG9hZExhbmcoa2V5LCB2YWx1ZXMpIHtcclxuICAgICAgICB2YWx1ZXMuYWJiciA9IGtleTtcclxuICAgICAgICBpZiAoIWxhbmd1YWdlc1trZXldKSB7XHJcbiAgICAgICAgICAgIGxhbmd1YWdlc1trZXldID0gbmV3IExhbmd1YWdlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxhbmd1YWdlc1trZXldLnNldCh2YWx1ZXMpO1xyXG4gICAgICAgIHJldHVybiBsYW5ndWFnZXNba2V5XTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZW1vdmUgYSBsYW5ndWFnZSBmcm9tIHRoZSBgbGFuZ3VhZ2VzYCBjYWNoZS4gTW9zdGx5IHVzZWZ1bCBpbiB0ZXN0cy5cclxuICAgIGZ1bmN0aW9uIHVubG9hZExhbmcoa2V5KSB7XHJcbiAgICAgICAgZGVsZXRlIGxhbmd1YWdlc1trZXldO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERldGVybWluZXMgd2hpY2ggbGFuZ3VhZ2UgZGVmaW5pdGlvbiB0byB1c2UgYW5kIHJldHVybnMgaXQuXHJcbiAgICAvL1xyXG4gICAgLy8gV2l0aCBubyBwYXJhbWV0ZXJzLCBpdCB3aWxsIHJldHVybiB0aGUgZ2xvYmFsIGxhbmd1YWdlLiAgSWYgeW91XHJcbiAgICAvLyBwYXNzIGluIGEgbGFuZ3VhZ2Uga2V5LCBzdWNoIGFzICdlbicsIGl0IHdpbGwgcmV0dXJuIHRoZVxyXG4gICAgLy8gZGVmaW5pdGlvbiBmb3IgJ2VuJywgc28gbG9uZyBhcyAnZW4nIGhhcyBhbHJlYWR5IGJlZW4gbG9hZGVkIHVzaW5nXHJcbiAgICAvLyBtb21lbnQubGFuZy5cclxuICAgIGZ1bmN0aW9uIGdldExhbmdEZWZpbml0aW9uKGtleSkge1xyXG4gICAgICAgIHZhciBpID0gMCwgaiwgbGFuZywgbmV4dCwgc3BsaXQsXHJcbiAgICAgICAgICAgIGdldCA9IGZ1bmN0aW9uIChrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWxhbmd1YWdlc1trXSAmJiBoYXNNb2R1bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlKCcuL2xhbmcvJyArIGspO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1trXTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCFrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudC5mbi5fbGFuZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaXNBcnJheShrZXkpKSB7XHJcbiAgICAgICAgICAgIC8vc2hvcnQtY2lyY3VpdCBldmVyeXRoaW5nIGVsc2VcclxuICAgICAgICAgICAgbGFuZyA9IGdldChrZXkpO1xyXG4gICAgICAgICAgICBpZiAobGFuZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhbmc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAga2V5ID0gW2tleV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3BpY2sgdGhlIGxhbmd1YWdlIGZyb20gdGhlIGFycmF5XHJcbiAgICAgICAgLy90cnkgWydlbi1hdScsICdlbi1nYiddIGFzICdlbi1hdScsICdlbi1nYicsICdlbicsIGFzIGluIG1vdmUgdGhyb3VnaCB0aGUgbGlzdCB0cnlpbmcgZWFjaFxyXG4gICAgICAgIC8vc3Vic3RyaW5nIGZyb20gbW9zdCBzcGVjaWZpYyB0byBsZWFzdCwgYnV0IG1vdmUgdG8gdGhlIG5leHQgYXJyYXkgaXRlbSBpZiBpdCdzIGEgbW9yZSBzcGVjaWZpYyB2YXJpYW50IHRoYW4gdGhlIGN1cnJlbnQgcm9vdFxyXG4gICAgICAgIHdoaWxlIChpIDwga2V5Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICBzcGxpdCA9IG5vcm1hbGl6ZUxhbmd1YWdlKGtleVtpXSkuc3BsaXQoJy0nKTtcclxuICAgICAgICAgICAgaiA9IHNwbGl0Lmxlbmd0aDtcclxuICAgICAgICAgICAgbmV4dCA9IG5vcm1hbGl6ZUxhbmd1YWdlKGtleVtpICsgMV0pO1xyXG4gICAgICAgICAgICBuZXh0ID0gbmV4dCA/IG5leHQuc3BsaXQoJy0nKSA6IG51bGw7XHJcbiAgICAgICAgICAgIHdoaWxlIChqID4gMCkge1xyXG4gICAgICAgICAgICAgICAgbGFuZyA9IGdldChzcGxpdC5zbGljZSgwLCBqKS5qb2luKCctJykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxhbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGFuZztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChuZXh0ICYmIG5leHQubGVuZ3RoID49IGogJiYgY29tcGFyZUFycmF5cyhzcGxpdCwgbmV4dCwgdHJ1ZSkgPj0gaiAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL3RoZSBuZXh0IGFycmF5IGl0ZW0gaXMgYmV0dGVyIHRoYW4gYSBzaGFsbG93ZXIgc3Vic3RyaW5nIG9mIHRoaXMgb25lXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBqLS07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbW9tZW50LmZuLl9sYW5nO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBGb3JtYXR0aW5nXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHJlbW92ZUZvcm1hdHRpbmdUb2tlbnMoaW5wdXQpIHtcclxuICAgICAgICBpZiAoaW5wdXQubWF0Y2goL1xcW1tcXHNcXFNdLykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL15cXFt8XFxdJC9nLCBcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xcXFwvZywgXCJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZUZvcm1hdEZ1bmN0aW9uKGZvcm1hdCkge1xyXG4gICAgICAgIHZhciBhcnJheSA9IGZvcm1hdC5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSwgaSwgbGVuZ3RoO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbYXJyYXlbaV1dKSB7XHJcbiAgICAgICAgICAgICAgICBhcnJheVtpXSA9IGZvcm1hdFRva2VuRnVuY3Rpb25zW2FycmF5W2ldXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFycmF5W2ldID0gcmVtb3ZlRm9ybWF0dGluZ1Rva2VucyhhcnJheVtpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobW9tKSB7XHJcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSBcIlwiO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIG91dHB1dCArPSBhcnJheVtpXSBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gYXJyYXlbaV0uY2FsbChtb20sIGZvcm1hdCkgOiBhcnJheVtpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZm9ybWF0IGRhdGUgdXNpbmcgbmF0aXZlIGRhdGUgb2JqZWN0XHJcbiAgICBmdW5jdGlvbiBmb3JtYXRNb21lbnQobSwgZm9ybWF0KSB7XHJcblxyXG4gICAgICAgIGlmICghbS5pc1ZhbGlkKCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG0ubGFuZygpLmludmFsaWREYXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3JtYXQgPSBleHBhbmRGb3JtYXQoZm9ybWF0LCBtLmxhbmcoKSk7XHJcblxyXG4gICAgICAgIGlmICghZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0pIHtcclxuICAgICAgICAgICAgZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0gPSBtYWtlRm9ybWF0RnVuY3Rpb24oZm9ybWF0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XShtKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBleHBhbmRGb3JtYXQoZm9ybWF0LCBsYW5nKSB7XHJcbiAgICAgICAgdmFyIGkgPSA1O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiByZXBsYWNlTG9uZ0RhdGVGb3JtYXRUb2tlbnMoaW5wdXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGxhbmcubG9uZ0RhdGVGb3JtYXQoaW5wdXQpIHx8IGlucHV0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLmxhc3RJbmRleCA9IDA7XHJcbiAgICAgICAgd2hpbGUgKGkgPj0gMCAmJiBsb2NhbEZvcm1hdHRpbmdUb2tlbnMudGVzdChmb3JtYXQpKSB7XHJcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKGxvY2FsRm9ybWF0dGluZ1Rva2VucywgcmVwbGFjZUxvbmdEYXRlRm9ybWF0VG9rZW5zKTtcclxuICAgICAgICAgICAgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLmxhc3RJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIGkgLT0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmb3JtYXQ7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBQYXJzaW5nXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIC8vIGdldCB0aGUgcmVnZXggdG8gZmluZCB0aGUgbmV4dCB0b2tlblxyXG4gICAgZnVuY3Rpb24gZ2V0UGFyc2VSZWdleEZvclRva2VuKHRva2VuLCBjb25maWcpIHtcclxuICAgICAgICB2YXIgYSwgc3RyaWN0ID0gY29uZmlnLl9zdHJpY3Q7XHJcbiAgICAgICAgc3dpdGNoICh0b2tlbikge1xyXG4gICAgICAgIGNhc2UgJ1EnOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbk9uZURpZ2l0O1xyXG4gICAgICAgIGNhc2UgJ0REREQnOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblRocmVlRGlnaXRzO1xyXG4gICAgICAgIGNhc2UgJ1lZWVknOlxyXG4gICAgICAgIGNhc2UgJ0dHR0cnOlxyXG4gICAgICAgIGNhc2UgJ2dnZ2cnOlxyXG4gICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gcGFyc2VUb2tlbkZvdXJEaWdpdHMgOiBwYXJzZVRva2VuT25lVG9Gb3VyRGlnaXRzO1xyXG4gICAgICAgIGNhc2UgJ1knOlxyXG4gICAgICAgIGNhc2UgJ0cnOlxyXG4gICAgICAgIGNhc2UgJ2cnOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblNpZ25lZE51bWJlcjtcclxuICAgICAgICBjYXNlICdZWVlZWVknOlxyXG4gICAgICAgIGNhc2UgJ1lZWVlZJzpcclxuICAgICAgICBjYXNlICdHR0dHRyc6XHJcbiAgICAgICAgY2FzZSAnZ2dnZ2cnOlxyXG4gICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gcGFyc2VUb2tlblNpeERpZ2l0cyA6IHBhcnNlVG9rZW5PbmVUb1NpeERpZ2l0cztcclxuICAgICAgICBjYXNlICdTJzpcclxuICAgICAgICAgICAgaWYgKHN0cmljdCkgeyByZXR1cm4gcGFyc2VUb2tlbk9uZURpZ2l0OyB9XHJcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICBjYXNlICdTUyc6XHJcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHsgcmV0dXJuIHBhcnNlVG9rZW5Ud29EaWdpdHM7IH1cclxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xyXG4gICAgICAgIGNhc2UgJ1NTUyc6XHJcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHsgcmV0dXJuIHBhcnNlVG9rZW5UaHJlZURpZ2l0czsgfVxyXG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgY2FzZSAnREREJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5PbmVUb1RocmVlRGlnaXRzO1xyXG4gICAgICAgIGNhc2UgJ01NTSc6XHJcbiAgICAgICAgY2FzZSAnTU1NTSc6XHJcbiAgICAgICAgY2FzZSAnZGQnOlxyXG4gICAgICAgIGNhc2UgJ2RkZCc6XHJcbiAgICAgICAgY2FzZSAnZGRkZCc6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuV29yZDtcclxuICAgICAgICBjYXNlICdhJzpcclxuICAgICAgICBjYXNlICdBJzpcclxuICAgICAgICAgICAgcmV0dXJuIGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCkuX21lcmlkaWVtUGFyc2U7XHJcbiAgICAgICAgY2FzZSAnWCc6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuVGltZXN0YW1wTXM7XHJcbiAgICAgICAgY2FzZSAnWic6XHJcbiAgICAgICAgY2FzZSAnWlonOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblRpbWV6b25lO1xyXG4gICAgICAgIGNhc2UgJ1QnOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblQ7XHJcbiAgICAgICAgY2FzZSAnU1NTUyc6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuRGlnaXRzO1xyXG4gICAgICAgIGNhc2UgJ01NJzpcclxuICAgICAgICBjYXNlICdERCc6XHJcbiAgICAgICAgY2FzZSAnWVknOlxyXG4gICAgICAgIGNhc2UgJ0dHJzpcclxuICAgICAgICBjYXNlICdnZyc6XHJcbiAgICAgICAgY2FzZSAnSEgnOlxyXG4gICAgICAgIGNhc2UgJ2hoJzpcclxuICAgICAgICBjYXNlICdtbSc6XHJcbiAgICAgICAgY2FzZSAnc3MnOlxyXG4gICAgICAgIGNhc2UgJ3d3JzpcclxuICAgICAgICBjYXNlICdXVyc6XHJcbiAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBwYXJzZVRva2VuVHdvRGlnaXRzIDogcGFyc2VUb2tlbk9uZU9yVHdvRGlnaXRzO1xyXG4gICAgICAgIGNhc2UgJ00nOlxyXG4gICAgICAgIGNhc2UgJ0QnOlxyXG4gICAgICAgIGNhc2UgJ2QnOlxyXG4gICAgICAgIGNhc2UgJ0gnOlxyXG4gICAgICAgIGNhc2UgJ2gnOlxyXG4gICAgICAgIGNhc2UgJ20nOlxyXG4gICAgICAgIGNhc2UgJ3MnOlxyXG4gICAgICAgIGNhc2UgJ3cnOlxyXG4gICAgICAgIGNhc2UgJ1cnOlxyXG4gICAgICAgIGNhc2UgJ2UnOlxyXG4gICAgICAgIGNhc2UgJ0UnOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbk9uZU9yVHdvRGlnaXRzO1xyXG4gICAgICAgIGNhc2UgJ0RvJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5PcmRpbmFsO1xyXG4gICAgICAgIGRlZmF1bHQgOlxyXG4gICAgICAgICAgICBhID0gbmV3IFJlZ0V4cChyZWdleHBFc2NhcGUodW5lc2NhcGVGb3JtYXQodG9rZW4ucmVwbGFjZSgnXFxcXCcsICcnKSksIFwiaVwiKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBhO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0aW1lem9uZU1pbnV0ZXNGcm9tU3RyaW5nKHN0cmluZykge1xyXG4gICAgICAgIHN0cmluZyA9IHN0cmluZyB8fCBcIlwiO1xyXG4gICAgICAgIHZhciBwb3NzaWJsZVR6TWF0Y2hlcyA9IChzdHJpbmcubWF0Y2gocGFyc2VUb2tlblRpbWV6b25lKSB8fCBbXSksXHJcbiAgICAgICAgICAgIHR6Q2h1bmsgPSBwb3NzaWJsZVR6TWF0Y2hlc1twb3NzaWJsZVR6TWF0Y2hlcy5sZW5ndGggLSAxXSB8fCBbXSxcclxuICAgICAgICAgICAgcGFydHMgPSAodHpDaHVuayArICcnKS5tYXRjaChwYXJzZVRpbWV6b25lQ2h1bmtlcikgfHwgWyctJywgMCwgMF0sXHJcbiAgICAgICAgICAgIG1pbnV0ZXMgPSArKHBhcnRzWzFdICogNjApICsgdG9JbnQocGFydHNbMl0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcGFydHNbMF0gPT09ICcrJyA/IC1taW51dGVzIDogbWludXRlcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBmdW5jdGlvbiB0byBjb252ZXJ0IHN0cmluZyBpbnB1dCB0byBkYXRlXHJcbiAgICBmdW5jdGlvbiBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgaW5wdXQsIGNvbmZpZykge1xyXG4gICAgICAgIHZhciBhLCBkYXRlUGFydEFycmF5ID0gY29uZmlnLl9hO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKHRva2VuKSB7XHJcbiAgICAgICAgLy8gUVVBUlRFUlxyXG4gICAgICAgIGNhc2UgJ1EnOlxyXG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNT05USF0gPSAodG9JbnQoaW5wdXQpIC0gMSkgKiAzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIE1PTlRIXHJcbiAgICAgICAgY2FzZSAnTScgOiAvLyBmYWxsIHRocm91Z2ggdG8gTU1cclxuICAgICAgICBjYXNlICdNTScgOlxyXG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNT05USF0gPSB0b0ludChpbnB1dCkgLSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ01NTScgOiAvLyBmYWxsIHRocm91Z2ggdG8gTU1NTVxyXG4gICAgICAgIGNhc2UgJ01NTU0nIDpcclxuICAgICAgICAgICAgYSA9IGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCkubW9udGhzUGFyc2UoaW5wdXQpO1xyXG4gICAgICAgICAgICAvLyBpZiB3ZSBkaWRuJ3QgZmluZCBhIG1vbnRoIG5hbWUsIG1hcmsgdGhlIGRhdGUgYXMgaW52YWxpZC5cclxuICAgICAgICAgICAgaWYgKGEgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNT05USF0gPSBhO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi5pbnZhbGlkTW9udGggPSBpbnB1dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBEQVkgT0YgTU9OVEhcclxuICAgICAgICBjYXNlICdEJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBERFxyXG4gICAgICAgIGNhc2UgJ0REJyA6XHJcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W0RBVEVdID0gdG9JbnQoaW5wdXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ0RvJyA6XHJcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W0RBVEVdID0gdG9JbnQocGFyc2VJbnQoaW5wdXQsIDEwKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gREFZIE9GIFlFQVJcclxuICAgICAgICBjYXNlICdEREQnIDogLy8gZmFsbCB0aHJvdWdoIHRvIERERERcclxuICAgICAgICBjYXNlICdEREREJyA6XHJcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRvSW50KGlucHV0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gWUVBUlxyXG4gICAgICAgIGNhc2UgJ1lZJyA6XHJcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbWUVBUl0gPSBtb21lbnQucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdZWVlZJyA6XHJcbiAgICAgICAgY2FzZSAnWVlZWVknIDpcclxuICAgICAgICBjYXNlICdZWVlZWVknIDpcclxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtZRUFSXSA9IHRvSW50KGlucHV0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gQU0gLyBQTVxyXG4gICAgICAgIGNhc2UgJ2EnIDogLy8gZmFsbCB0aHJvdWdoIHRvIEFcclxuICAgICAgICBjYXNlICdBJyA6XHJcbiAgICAgICAgICAgIGNvbmZpZy5faXNQbSA9IGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCkuaXNQTShpbnB1dCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIDI0IEhPVVJcclxuICAgICAgICBjYXNlICdIJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBoaFxyXG4gICAgICAgIGNhc2UgJ0hIJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBoaFxyXG4gICAgICAgIGNhc2UgJ2gnIDogLy8gZmFsbCB0aHJvdWdoIHRvIGhoXHJcbiAgICAgICAgY2FzZSAnaGgnIDpcclxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtIT1VSXSA9IHRvSW50KGlucHV0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gTUlOVVRFXHJcbiAgICAgICAgY2FzZSAnbScgOiAvLyBmYWxsIHRocm91Z2ggdG8gbW1cclxuICAgICAgICBjYXNlICdtbScgOlxyXG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W01JTlVURV0gPSB0b0ludChpbnB1dCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIFNFQ09ORFxyXG4gICAgICAgIGNhc2UgJ3MnIDogLy8gZmFsbCB0aHJvdWdoIHRvIHNzXHJcbiAgICAgICAgY2FzZSAnc3MnIDpcclxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtTRUNPTkRdID0gdG9JbnQoaW5wdXQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBNSUxMSVNFQ09ORFxyXG4gICAgICAgIGNhc2UgJ1MnIDpcclxuICAgICAgICBjYXNlICdTUycgOlxyXG4gICAgICAgIGNhc2UgJ1NTUycgOlxyXG4gICAgICAgIGNhc2UgJ1NTU1MnIDpcclxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNSUxMSVNFQ09ORF0gPSB0b0ludCgoJzAuJyArIGlucHV0KSAqIDEwMDApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBVTklYIFRJTUVTVEFNUCBXSVRIIE1TXHJcbiAgICAgICAgY2FzZSAnWCc6XHJcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHBhcnNlRmxvYXQoaW5wdXQpICogMTAwMCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIFRJTUVaT05FXHJcbiAgICAgICAgY2FzZSAnWicgOiAvLyBmYWxsIHRocm91Z2ggdG8gWlpcclxuICAgICAgICBjYXNlICdaWicgOlxyXG4gICAgICAgICAgICBjb25maWcuX3VzZVVUQyA9IHRydWU7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fdHptID0gdGltZXpvbmVNaW51dGVzRnJvbVN0cmluZyhpbnB1dCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIFdFRUtEQVkgLSBodW1hblxyXG4gICAgICAgIGNhc2UgJ2RkJzpcclxuICAgICAgICBjYXNlICdkZGQnOlxyXG4gICAgICAgIGNhc2UgJ2RkZGQnOlxyXG4gICAgICAgICAgICBhID0gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcclxuICAgICAgICAgICAgLy8gaWYgd2UgZGlkbid0IGdldCBhIHdlZWtkYXkgbmFtZSwgbWFyayB0aGUgZGF0ZSBhcyBpbnZhbGlkXHJcbiAgICAgICAgICAgIGlmIChhICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5fdyA9IGNvbmZpZy5fdyB8fCB7fTtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5fd1snZCddID0gYTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZFdlZWtkYXkgPSBpbnB1dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBXRUVLLCBXRUVLIERBWSAtIG51bWVyaWNcclxuICAgICAgICBjYXNlICd3JzpcclxuICAgICAgICBjYXNlICd3dyc6XHJcbiAgICAgICAgY2FzZSAnVyc6XHJcbiAgICAgICAgY2FzZSAnV1cnOlxyXG4gICAgICAgIGNhc2UgJ2QnOlxyXG4gICAgICAgIGNhc2UgJ2UnOlxyXG4gICAgICAgIGNhc2UgJ0UnOlxyXG4gICAgICAgICAgICB0b2tlbiA9IHRva2VuLnN1YnN0cigwLCAxKTtcclxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xyXG4gICAgICAgIGNhc2UgJ2dnZ2cnOlxyXG4gICAgICAgIGNhc2UgJ0dHR0cnOlxyXG4gICAgICAgIGNhc2UgJ0dHR0dHJzpcclxuICAgICAgICAgICAgdG9rZW4gPSB0b2tlbi5zdWJzdHIoMCwgMik7XHJcbiAgICAgICAgICAgIGlmIChpbnB1dCkge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLl93W3Rva2VuXSA9IHRvSW50KGlucHV0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdnZyc6XHJcbiAgICAgICAgY2FzZSAnR0cnOlxyXG4gICAgICAgICAgICBjb25maWcuX3cgPSBjb25maWcuX3cgfHwge307XHJcbiAgICAgICAgICAgIGNvbmZpZy5fd1t0b2tlbl0gPSBtb21lbnQucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkYXlPZlllYXJGcm9tV2Vla0luZm8oY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIHcsIHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSwgdGVtcCwgbGFuZztcclxuXHJcbiAgICAgICAgdyA9IGNvbmZpZy5fdztcclxuICAgICAgICBpZiAody5HRyAhPSBudWxsIHx8IHcuVyAhPSBudWxsIHx8IHcuRSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGRvdyA9IDE7XHJcbiAgICAgICAgICAgIGRveSA9IDQ7XHJcblxyXG4gICAgICAgICAgICAvLyBUT0RPOiBXZSBuZWVkIHRvIHRha2UgdGhlIGN1cnJlbnQgaXNvV2Vla1llYXIsIGJ1dCB0aGF0IGRlcGVuZHMgb25cclxuICAgICAgICAgICAgLy8gaG93IHdlIGludGVycHJldCBub3cgKGxvY2FsLCB1dGMsIGZpeGVkIG9mZnNldCkuIFNvIGNyZWF0ZVxyXG4gICAgICAgICAgICAvLyBhIG5vdyB2ZXJzaW9uIG9mIGN1cnJlbnQgY29uZmlnICh0YWtlIGxvY2FsL3V0Yy9vZmZzZXQgZmxhZ3MsIGFuZFxyXG4gICAgICAgICAgICAvLyBjcmVhdGUgbm93KS5cclxuICAgICAgICAgICAgd2Vla1llYXIgPSBkZmwody5HRywgY29uZmlnLl9hW1lFQVJdLCB3ZWVrT2ZZZWFyKG1vbWVudCgpLCAxLCA0KS55ZWFyKTtcclxuICAgICAgICAgICAgd2VlayA9IGRmbCh3LlcsIDEpO1xyXG4gICAgICAgICAgICB3ZWVrZGF5ID0gZGZsKHcuRSwgMSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCk7XHJcbiAgICAgICAgICAgIGRvdyA9IGxhbmcuX3dlZWsuZG93O1xyXG4gICAgICAgICAgICBkb3kgPSBsYW5nLl93ZWVrLmRveTtcclxuXHJcbiAgICAgICAgICAgIHdlZWtZZWFyID0gZGZsKHcuZ2csIGNvbmZpZy5fYVtZRUFSXSwgd2Vla09mWWVhcihtb21lbnQoKSwgZG93LCBkb3kpLnllYXIpO1xyXG4gICAgICAgICAgICB3ZWVrID0gZGZsKHcudywgMSk7XHJcblxyXG4gICAgICAgICAgICBpZiAody5kICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIC8vIHdlZWtkYXkgLS0gbG93IGRheSBudW1iZXJzIGFyZSBjb25zaWRlcmVkIG5leHQgd2Vla1xyXG4gICAgICAgICAgICAgICAgd2Vla2RheSA9IHcuZDtcclxuICAgICAgICAgICAgICAgIGlmICh3ZWVrZGF5IDwgZG93KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgKyt3ZWVrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHcuZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBsb2NhbCB3ZWVrZGF5IC0tIGNvdW50aW5nIHN0YXJ0cyBmcm9tIGJlZ2luaW5nIG9mIHdlZWtcclxuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSB3LmUgKyBkb3c7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBkZWZhdWx0IHRvIGJlZ2luaW5nIG9mIHdlZWtcclxuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSBkb3c7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGVtcCA9IGRheU9mWWVhckZyb21XZWVrcyh3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG95LCBkb3cpO1xyXG5cclxuICAgICAgICBjb25maWcuX2FbWUVBUl0gPSB0ZW1wLnllYXI7XHJcbiAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0ZW1wLmRheU9mWWVhcjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjb252ZXJ0IGFuIGFycmF5IHRvIGEgZGF0ZS5cclxuICAgIC8vIHRoZSBhcnJheSBzaG91bGQgbWlycm9yIHRoZSBwYXJhbWV0ZXJzIGJlbG93XHJcbiAgICAvLyBub3RlOiBhbGwgdmFsdWVzIHBhc3QgdGhlIHllYXIgYXJlIG9wdGlvbmFsIGFuZCB3aWxsIGRlZmF1bHQgdG8gdGhlIGxvd2VzdCBwb3NzaWJsZSB2YWx1ZS5cclxuICAgIC8vIFt5ZWFyLCBtb250aCwgZGF5ICwgaG91ciwgbWludXRlLCBzZWNvbmQsIG1pbGxpc2Vjb25kXVxyXG4gICAgZnVuY3Rpb24gZGF0ZUZyb21Db25maWcoY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIGksIGRhdGUsIGlucHV0ID0gW10sIGN1cnJlbnREYXRlLCB5ZWFyVG9Vc2U7XHJcblxyXG4gICAgICAgIGlmIChjb25maWcuX2QpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3VycmVudERhdGUgPSBjdXJyZW50RGF0ZUFycmF5KGNvbmZpZyk7XHJcblxyXG4gICAgICAgIC8vY29tcHV0ZSBkYXkgb2YgdGhlIHllYXIgZnJvbSB3ZWVrcyBhbmQgd2Vla2RheXNcclxuICAgICAgICBpZiAoY29uZmlnLl93ICYmIGNvbmZpZy5fYVtEQVRFXSA9PSBudWxsICYmIGNvbmZpZy5fYVtNT05USF0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBkYXlPZlllYXJGcm9tV2Vla0luZm8oY29uZmlnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vaWYgdGhlIGRheSBvZiB0aGUgeWVhciBpcyBzZXQsIGZpZ3VyZSBvdXQgd2hhdCBpdCBpc1xyXG4gICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhcikge1xyXG4gICAgICAgICAgICB5ZWFyVG9Vc2UgPSBkZmwoY29uZmlnLl9hW1lFQVJdLCBjdXJyZW50RGF0ZVtZRUFSXSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIgPiBkYXlzSW5ZZWFyKHllYXJUb1VzZSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuX292ZXJmbG93RGF5T2ZZZWFyID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZGF0ZSA9IG1ha2VVVENEYXRlKHllYXJUb1VzZSwgMCwgY29uZmlnLl9kYXlPZlllYXIpO1xyXG4gICAgICAgICAgICBjb25maWcuX2FbTU9OVEhdID0gZGF0ZS5nZXRVVENNb250aCgpO1xyXG4gICAgICAgICAgICBjb25maWcuX2FbREFURV0gPSBkYXRlLmdldFVUQ0RhdGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIERlZmF1bHQgdG8gY3VycmVudCBkYXRlLlxyXG4gICAgICAgIC8vICogaWYgbm8geWVhciwgbW9udGgsIGRheSBvZiBtb250aCBhcmUgZ2l2ZW4sIGRlZmF1bHQgdG8gdG9kYXlcclxuICAgICAgICAvLyAqIGlmIGRheSBvZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBtb250aCBhbmQgeWVhclxyXG4gICAgICAgIC8vICogaWYgbW9udGggaXMgZ2l2ZW4sIGRlZmF1bHQgb25seSB5ZWFyXHJcbiAgICAgICAgLy8gKiBpZiB5ZWFyIGlzIGdpdmVuLCBkb24ndCBkZWZhdWx0IGFueXRoaW5nXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDMgJiYgY29uZmlnLl9hW2ldID09IG51bGw7ICsraSkge1xyXG4gICAgICAgICAgICBjb25maWcuX2FbaV0gPSBpbnB1dFtpXSA9IGN1cnJlbnREYXRlW2ldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gWmVybyBvdXQgd2hhdGV2ZXIgd2FzIG5vdCBkZWZhdWx0ZWQsIGluY2x1ZGluZyB0aW1lXHJcbiAgICAgICAgZm9yICg7IGkgPCA3OyBpKyspIHtcclxuICAgICAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSAoY29uZmlnLl9hW2ldID09IG51bGwpID8gKGkgPT09IDIgPyAxIDogMCkgOiBjb25maWcuX2FbaV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25maWcuX2QgPSAoY29uZmlnLl91c2VVVEMgPyBtYWtlVVRDRGF0ZSA6IG1ha2VEYXRlKS5hcHBseShudWxsLCBpbnB1dCk7XHJcbiAgICAgICAgLy8gQXBwbHkgdGltZXpvbmUgb2Zmc2V0IGZyb20gaW5wdXQuIFRoZSBhY3R1YWwgem9uZSBjYW4gYmUgY2hhbmdlZFxyXG4gICAgICAgIC8vIHdpdGggcGFyc2Vab25lLlxyXG4gICAgICAgIGlmIChjb25maWcuX3R6bSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fZC5zZXRVVENNaW51dGVzKGNvbmZpZy5fZC5nZXRVVENNaW51dGVzKCkgKyBjb25maWcuX3R6bSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRhdGVGcm9tT2JqZWN0KGNvbmZpZykge1xyXG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQ7XHJcblxyXG4gICAgICAgIGlmIChjb25maWcuX2QpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbm9ybWFsaXplZElucHV0ID0gbm9ybWFsaXplT2JqZWN0VW5pdHMoY29uZmlnLl9pKTtcclxuICAgICAgICBjb25maWcuX2EgPSBbXHJcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC55ZWFyLFxyXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQubW9udGgsXHJcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5kYXksXHJcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5ob3VyLFxyXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQubWludXRlLFxyXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuc2Vjb25kLFxyXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQubWlsbGlzZWNvbmRcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBkYXRlRnJvbUNvbmZpZyhjb25maWcpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgaWYgKGNvbmZpZy5fdXNlVVRDKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICAgICBub3cuZ2V0VVRDRnVsbFllYXIoKSxcclxuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENNb250aCgpLFxyXG4gICAgICAgICAgICAgICAgbm93LmdldFVUQ0RhdGUoKVxyXG4gICAgICAgICAgICBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbbm93LmdldEZ1bGxZZWFyKCksIG5vdy5nZXRNb250aCgpLCBub3cuZ2V0RGF0ZSgpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgZm9ybWF0IHN0cmluZ1xyXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZykge1xyXG5cclxuICAgICAgICBpZiAoY29uZmlnLl9mID09PSBtb21lbnQuSVNPXzg2MDEpIHtcclxuICAgICAgICAgICAgcGFyc2VJU08oY29uZmlnKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uZmlnLl9hID0gW107XHJcbiAgICAgICAgY29uZmlnLl9wZi5lbXB0eSA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIFRoaXMgYXJyYXkgaXMgdXNlZCB0byBtYWtlIGEgRGF0ZSwgZWl0aGVyIHdpdGggYG5ldyBEYXRlYCBvciBgRGF0ZS5VVENgXHJcbiAgICAgICAgdmFyIGxhbmcgPSBnZXRMYW5nRGVmaW5pdGlvbihjb25maWcuX2wpLFxyXG4gICAgICAgICAgICBzdHJpbmcgPSAnJyArIGNvbmZpZy5faSxcclxuICAgICAgICAgICAgaSwgcGFyc2VkSW5wdXQsIHRva2VucywgdG9rZW4sIHNraXBwZWQsXHJcbiAgICAgICAgICAgIHN0cmluZ0xlbmd0aCA9IHN0cmluZy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGggPSAwO1xyXG5cclxuICAgICAgICB0b2tlbnMgPSBleHBhbmRGb3JtYXQoY29uZmlnLl9mLCBsYW5nKS5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSB8fCBbXTtcclxuXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcclxuICAgICAgICAgICAgcGFyc2VkSW5wdXQgPSAoc3RyaW5nLm1hdGNoKGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSkgfHwgW10pWzBdO1xyXG4gICAgICAgICAgICBpZiAocGFyc2VkSW5wdXQpIHtcclxuICAgICAgICAgICAgICAgIHNraXBwZWQgPSBzdHJpbmcuc3Vic3RyKDAsIHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2tpcHBlZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLl9wZi51bnVzZWRJbnB1dC5wdXNoKHNraXBwZWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSArIHBhcnNlZElucHV0Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoICs9IHBhcnNlZElucHV0Lmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBkb24ndCBwYXJzZSBpZiBpdCdzIG5vdCBhIGtub3duIHRva2VuXHJcbiAgICAgICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1t0b2tlbl0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuZW1wdHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYudW51c2VkVG9rZW5zLnB1c2godG9rZW4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYWRkVGltZVRvQXJyYXlGcm9tVG9rZW4odG9rZW4sIHBhcnNlZElucHV0LCBjb25maWcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGNvbmZpZy5fc3RyaWN0ICYmICFwYXJzZWRJbnB1dCkge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGFkZCByZW1haW5pbmcgdW5wYXJzZWQgaW5wdXQgbGVuZ3RoIHRvIHRoZSBzdHJpbmdcclxuICAgICAgICBjb25maWcuX3BmLmNoYXJzTGVmdE92ZXIgPSBzdHJpbmdMZW5ndGggLSB0b3RhbFBhcnNlZElucHV0TGVuZ3RoO1xyXG4gICAgICAgIGlmIChzdHJpbmcubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZElucHV0LnB1c2goc3RyaW5nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGhhbmRsZSBhbSBwbVxyXG4gICAgICAgIGlmIChjb25maWcuX2lzUG0gJiYgY29uZmlnLl9hW0hPVVJdIDwgMTIpIHtcclxuICAgICAgICAgICAgY29uZmlnLl9hW0hPVVJdICs9IDEyO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBpZiBpcyAxMiBhbSwgY2hhbmdlIGhvdXJzIHRvIDBcclxuICAgICAgICBpZiAoY29uZmlnLl9pc1BtID09PSBmYWxzZSAmJiBjb25maWcuX2FbSE9VUl0gPT09IDEyKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fYVtIT1VSXSA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkYXRlRnJvbUNvbmZpZyhjb25maWcpO1xyXG4gICAgICAgIGNoZWNrT3ZlcmZsb3coY29uZmlnKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1bmVzY2FwZUZvcm1hdChzKSB7XHJcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXFxcXChcXFspfFxcXFwoXFxdKXxcXFsoW15cXF1cXFtdKilcXF18XFxcXCguKS9nLCBmdW5jdGlvbiAobWF0Y2hlZCwgcDEsIHAyLCBwMywgcDQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHAxIHx8IHAyIHx8IHAzIHx8IHA0O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvZGUgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM1NjE0OTMvaXMtdGhlcmUtYS1yZWdleHAtZXNjYXBlLWZ1bmN0aW9uLWluLWphdmFzY3JpcHRcclxuICAgIGZ1bmN0aW9uIHJlZ2V4cEVzY2FwZShzKSB7XHJcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgYXJyYXkgb2YgZm9ybWF0IHN0cmluZ3NcclxuICAgIGZ1bmN0aW9uIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEFycmF5KGNvbmZpZykge1xyXG4gICAgICAgIHZhciB0ZW1wQ29uZmlnLFxyXG4gICAgICAgICAgICBiZXN0TW9tZW50LFxyXG5cclxuICAgICAgICAgICAgc2NvcmVUb0JlYXQsXHJcbiAgICAgICAgICAgIGksXHJcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZTtcclxuXHJcbiAgICAgICAgaWYgKGNvbmZpZy5fZi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgY29uZmlnLl9wZi5pbnZhbGlkRm9ybWF0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoTmFOKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbmZpZy5fZi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgPSAwO1xyXG4gICAgICAgICAgICB0ZW1wQ29uZmlnID0gZXh0ZW5kKHt9LCBjb25maWcpO1xyXG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcclxuICAgICAgICAgICAgdGVtcENvbmZpZy5fZiA9IGNvbmZpZy5fZltpXTtcclxuICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KHRlbXBDb25maWcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFpc1ZhbGlkKHRlbXBDb25maWcpKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgYW55IGlucHV0IHRoYXQgd2FzIG5vdCBwYXJzZWQgYWRkIGEgcGVuYWx0eSBmb3IgdGhhdCBmb3JtYXRcclxuICAgICAgICAgICAgY3VycmVudFNjb3JlICs9IHRlbXBDb25maWcuX3BmLmNoYXJzTGVmdE92ZXI7XHJcblxyXG4gICAgICAgICAgICAvL29yIHRva2Vuc1xyXG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgKz0gdGVtcENvbmZpZy5fcGYudW51c2VkVG9rZW5zLmxlbmd0aCAqIDEwO1xyXG5cclxuICAgICAgICAgICAgdGVtcENvbmZpZy5fcGYuc2NvcmUgPSBjdXJyZW50U2NvcmU7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2NvcmVUb0JlYXQgPT0gbnVsbCB8fCBjdXJyZW50U2NvcmUgPCBzY29yZVRvQmVhdCkge1xyXG4gICAgICAgICAgICAgICAgc2NvcmVUb0JlYXQgPSBjdXJyZW50U2NvcmU7XHJcbiAgICAgICAgICAgICAgICBiZXN0TW9tZW50ID0gdGVtcENvbmZpZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXh0ZW5kKGNvbmZpZywgYmVzdE1vbWVudCB8fCB0ZW1wQ29uZmlnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBkYXRlIGZyb20gaXNvIGZvcm1hdFxyXG4gICAgZnVuY3Rpb24gcGFyc2VJU08oY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIGksIGwsXHJcbiAgICAgICAgICAgIHN0cmluZyA9IGNvbmZpZy5faSxcclxuICAgICAgICAgICAgbWF0Y2ggPSBpc29SZWdleC5leGVjKHN0cmluZyk7XHJcblxyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICBjb25maWcuX3BmLmlzbyA9IHRydWU7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGwgPSBpc29EYXRlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc29EYXRlc1tpXVsxXS5leGVjKHN0cmluZykpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBtYXRjaFs1XSBzaG91bGQgYmUgXCJUXCIgb3IgdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLl9mID0gaXNvRGF0ZXNbaV1bMF0gKyAobWF0Y2hbNl0gfHwgXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGwgPSBpc29UaW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc29UaW1lc1tpXVsxXS5leGVjKHN0cmluZykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25maWcuX2YgKz0gaXNvVGltZXNbaV1bMF07XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHN0cmluZy5tYXRjaChwYXJzZVRva2VuVGltZXpvbmUpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcuX2YgKz0gXCJaXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGRhdGUgZnJvbSBpc28gZm9ybWF0IG9yIGZhbGxiYWNrXHJcbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21TdHJpbmcoY29uZmlnKSB7XHJcbiAgICAgICAgcGFyc2VJU08oY29uZmlnKTtcclxuICAgICAgICBpZiAoY29uZmlnLl9pc1ZhbGlkID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBkZWxldGUgY29uZmlnLl9pc1ZhbGlkO1xyXG4gICAgICAgICAgICBtb21lbnQuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2soY29uZmlnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tSW5wdXQoY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLFxyXG4gICAgICAgICAgICBtYXRjaGVkID0gYXNwTmV0SnNvblJlZ2V4LmV4ZWMoaW5wdXQpO1xyXG5cclxuICAgICAgICBpZiAoaW5wdXQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobWF0Y2hlZCkge1xyXG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgrbWF0Y2hlZFsxXSk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZyhjb25maWcpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShpbnB1dCkpIHtcclxuICAgICAgICAgICAgY29uZmlnLl9hID0gaW5wdXQuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgIGRhdGVGcm9tQ29uZmlnKGNvbmZpZyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpc0RhdGUoaW5wdXQpKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKCtpbnB1dCk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YoaW5wdXQpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICBkYXRlRnJvbU9iamVjdChjb25maWcpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKGlucHV0KSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgLy8gZnJvbSBtaWxsaXNlY29uZHNcclxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoaW5wdXQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG1vbWVudC5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlRGF0ZSh5LCBtLCBkLCBoLCBNLCBzLCBtcykge1xyXG4gICAgICAgIC8vY2FuJ3QganVzdCBhcHBseSgpIHRvIGNyZWF0ZSBhIGRhdGU6XHJcbiAgICAgICAgLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE4MTM0OC9pbnN0YW50aWF0aW5nLWEtamF2YXNjcmlwdC1vYmplY3QtYnktY2FsbGluZy1wcm90b3R5cGUtY29uc3RydWN0b3ItYXBwbHlcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHksIG0sIGQsIGgsIE0sIHMsIG1zKTtcclxuXHJcbiAgICAgICAgLy90aGUgZGF0ZSBjb25zdHJ1Y3RvciBkb2Vzbid0IGFjY2VwdCB5ZWFycyA8IDE5NzBcclxuICAgICAgICBpZiAoeSA8IDE5NzApIHtcclxuICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRhdGU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZVVUQ0RhdGUoeSkge1xyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XHJcbiAgICAgICAgaWYgKHkgPCAxOTcwKSB7XHJcbiAgICAgICAgICAgIGRhdGUuc2V0VVRDRnVsbFllYXIoeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlV2Vla2RheShpbnB1dCwgbGFuZ3VhZ2UpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBpZiAoIWlzTmFOKGlucHV0KSkge1xyXG4gICAgICAgICAgICAgICAgaW5wdXQgPSBwYXJzZUludChpbnB1dCwgMTApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaW5wdXQgPSBsYW5ndWFnZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGlucHV0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBSZWxhdGl2ZSBUaW1lXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIC8vIGhlbHBlciBmdW5jdGlvbiBmb3IgbW9tZW50LmZuLmZyb20sIG1vbWVudC5mbi5mcm9tTm93LCBhbmQgbW9tZW50LmR1cmF0aW9uLmZuLmh1bWFuaXplXHJcbiAgICBmdW5jdGlvbiBzdWJzdGl0dXRlVGltZUFnbyhzdHJpbmcsIG51bWJlciwgd2l0aG91dFN1ZmZpeCwgaXNGdXR1cmUsIGxhbmcpIHtcclxuICAgICAgICByZXR1cm4gbGFuZy5yZWxhdGl2ZVRpbWUobnVtYmVyIHx8IDEsICEhd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVsYXRpdmVUaW1lKG1pbGxpc2Vjb25kcywgd2l0aG91dFN1ZmZpeCwgbGFuZykge1xyXG4gICAgICAgIHZhciBzZWNvbmRzID0gcm91bmQoTWF0aC5hYnMobWlsbGlzZWNvbmRzKSAvIDEwMDApLFxyXG4gICAgICAgICAgICBtaW51dGVzID0gcm91bmQoc2Vjb25kcyAvIDYwKSxcclxuICAgICAgICAgICAgaG91cnMgPSByb3VuZChtaW51dGVzIC8gNjApLFxyXG4gICAgICAgICAgICBkYXlzID0gcm91bmQoaG91cnMgLyAyNCksXHJcbiAgICAgICAgICAgIHllYXJzID0gcm91bmQoZGF5cyAvIDM2NSksXHJcbiAgICAgICAgICAgIGFyZ3MgPSBzZWNvbmRzIDwgcmVsYXRpdmVUaW1lVGhyZXNob2xkcy5zICAmJiBbJ3MnLCBzZWNvbmRzXSB8fFxyXG4gICAgICAgICAgICAgICAgbWludXRlcyA9PT0gMSAmJiBbJ20nXSB8fFxyXG4gICAgICAgICAgICAgICAgbWludXRlcyA8IHJlbGF0aXZlVGltZVRocmVzaG9sZHMubSAmJiBbJ21tJywgbWludXRlc10gfHxcclxuICAgICAgICAgICAgICAgIGhvdXJzID09PSAxICYmIFsnaCddIHx8XHJcbiAgICAgICAgICAgICAgICBob3VycyA8IHJlbGF0aXZlVGltZVRocmVzaG9sZHMuaCAmJiBbJ2hoJywgaG91cnNdIHx8XHJcbiAgICAgICAgICAgICAgICBkYXlzID09PSAxICYmIFsnZCddIHx8XHJcbiAgICAgICAgICAgICAgICBkYXlzIDw9IHJlbGF0aXZlVGltZVRocmVzaG9sZHMuZGQgJiYgWydkZCcsIGRheXNdIHx8XHJcbiAgICAgICAgICAgICAgICBkYXlzIDw9IHJlbGF0aXZlVGltZVRocmVzaG9sZHMuZG0gJiYgWydNJ10gfHxcclxuICAgICAgICAgICAgICAgIGRheXMgPCByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzLmR5ICYmIFsnTU0nLCByb3VuZChkYXlzIC8gMzApXSB8fFxyXG4gICAgICAgICAgICAgICAgeWVhcnMgPT09IDEgJiYgWyd5J10gfHwgWyd5eScsIHllYXJzXTtcclxuICAgICAgICBhcmdzWzJdID0gd2l0aG91dFN1ZmZpeDtcclxuICAgICAgICBhcmdzWzNdID0gbWlsbGlzZWNvbmRzID4gMDtcclxuICAgICAgICBhcmdzWzRdID0gbGFuZztcclxuICAgICAgICByZXR1cm4gc3Vic3RpdHV0ZVRpbWVBZ28uYXBwbHkoe30sIGFyZ3MpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgV2VlayBvZiBZZWFyXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIC8vIGZpcnN0RGF5T2ZXZWVrICAgICAgIDAgPSBzdW4sIDYgPSBzYXRcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIHRoZSBkYXkgb2YgdGhlIHdlZWsgdGhhdCBzdGFydHMgdGhlIHdlZWtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICh1c3VhbGx5IHN1bmRheSBvciBtb25kYXkpXHJcbiAgICAvLyBmaXJzdERheU9mV2Vla09mWWVhciAwID0gc3VuLCA2ID0gc2F0XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICB0aGUgZmlyc3Qgd2VlayBpcyB0aGUgd2VlayB0aGF0IGNvbnRhaW5zIHRoZSBmaXJzdFxyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgb2YgdGhpcyBkYXkgb2YgdGhlIHdlZWtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIChlZy4gSVNPIHdlZWtzIHVzZSB0aHVyc2RheSAoNCkpXHJcbiAgICBmdW5jdGlvbiB3ZWVrT2ZZZWFyKG1vbSwgZmlyc3REYXlPZldlZWssIGZpcnN0RGF5T2ZXZWVrT2ZZZWFyKSB7XHJcbiAgICAgICAgdmFyIGVuZCA9IGZpcnN0RGF5T2ZXZWVrT2ZZZWFyIC0gZmlyc3REYXlPZldlZWssXHJcbiAgICAgICAgICAgIGRheXNUb0RheU9mV2VlayA9IGZpcnN0RGF5T2ZXZWVrT2ZZZWFyIC0gbW9tLmRheSgpLFxyXG4gICAgICAgICAgICBhZGp1c3RlZE1vbWVudDtcclxuXHJcblxyXG4gICAgICAgIGlmIChkYXlzVG9EYXlPZldlZWsgPiBlbmQpIHtcclxuICAgICAgICAgICAgZGF5c1RvRGF5T2ZXZWVrIC09IDc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGF5c1RvRGF5T2ZXZWVrIDwgZW5kIC0gNykge1xyXG4gICAgICAgICAgICBkYXlzVG9EYXlPZldlZWsgKz0gNztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFkanVzdGVkTW9tZW50ID0gbW9tZW50KG1vbSkuYWRkKCdkJywgZGF5c1RvRGF5T2ZXZWVrKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB3ZWVrOiBNYXRoLmNlaWwoYWRqdXN0ZWRNb21lbnQuZGF5T2ZZZWFyKCkgLyA3KSxcclxuICAgICAgICAgICAgeWVhcjogYWRqdXN0ZWRNb21lbnQueWVhcigpXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvL2h0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSVNPX3dlZWtfZGF0ZSNDYWxjdWxhdGluZ19hX2RhdGVfZ2l2ZW5fdGhlX3llYXIuMkNfd2Vla19udW1iZXJfYW5kX3dlZWtkYXlcclxuICAgIGZ1bmN0aW9uIGRheU9mWWVhckZyb21XZWVrcyh5ZWFyLCB3ZWVrLCB3ZWVrZGF5LCBmaXJzdERheU9mV2Vla09mWWVhciwgZmlyc3REYXlPZldlZWspIHtcclxuICAgICAgICB2YXIgZCA9IG1ha2VVVENEYXRlKHllYXIsIDAsIDEpLmdldFVUQ0RheSgpLCBkYXlzVG9BZGQsIGRheU9mWWVhcjtcclxuXHJcbiAgICAgICAgZCA9IGQgPT09IDAgPyA3IDogZDtcclxuICAgICAgICB3ZWVrZGF5ID0gd2Vla2RheSAhPSBudWxsID8gd2Vla2RheSA6IGZpcnN0RGF5T2ZXZWVrO1xyXG4gICAgICAgIGRheXNUb0FkZCA9IGZpcnN0RGF5T2ZXZWVrIC0gZCArIChkID4gZmlyc3REYXlPZldlZWtPZlllYXIgPyA3IDogMCkgLSAoZCA8IGZpcnN0RGF5T2ZXZWVrID8gNyA6IDApO1xyXG4gICAgICAgIGRheU9mWWVhciA9IDcgKiAod2VlayAtIDEpICsgKHdlZWtkYXkgLSBmaXJzdERheU9mV2VlaykgKyBkYXlzVG9BZGQgKyAxO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB5ZWFyOiBkYXlPZlllYXIgPiAwID8geWVhciA6IHllYXIgLSAxLFxyXG4gICAgICAgICAgICBkYXlPZlllYXI6IGRheU9mWWVhciA+IDAgPyAgZGF5T2ZZZWFyIDogZGF5c0luWWVhcih5ZWFyIC0gMSkgKyBkYXlPZlllYXJcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBUb3AgTGV2ZWwgRnVuY3Rpb25zXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZU1vbWVudChjb25maWcpIHtcclxuICAgICAgICB2YXIgaW5wdXQgPSBjb25maWcuX2ksXHJcbiAgICAgICAgICAgIGZvcm1hdCA9IGNvbmZpZy5fZjtcclxuXHJcbiAgICAgICAgaWYgKGlucHV0ID09PSBudWxsIHx8IChmb3JtYXQgPT09IHVuZGVmaW5lZCAmJiBpbnB1dCA9PT0gJycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuaW52YWxpZCh7bnVsbElucHV0OiB0cnVlfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBjb25maWcuX2kgPSBpbnB1dCA9IGdldExhbmdEZWZpbml0aW9uKCkucHJlcGFyc2UoaW5wdXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1vbWVudC5pc01vbWVudChpbnB1dCkpIHtcclxuICAgICAgICAgICAgY29uZmlnID0gY2xvbmVNb21lbnQoaW5wdXQpO1xyXG5cclxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoK2lucHV0Ll9kKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCkge1xyXG4gICAgICAgICAgICBpZiAoaXNBcnJheShmb3JtYXQpKSB7XHJcbiAgICAgICAgICAgICAgICBtYWtlRGF0ZUZyb21TdHJpbmdBbmRBcnJheShjb25maWcpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21JbnB1dChjb25maWcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBNb21lbnQoY29uZmlnKTtcclxuICAgIH1cclxuXHJcbiAgICBtb21lbnQgPSBmdW5jdGlvbiAoaW5wdXQsIGZvcm1hdCwgbGFuZywgc3RyaWN0KSB7XHJcbiAgICAgICAgdmFyIGM7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YobGFuZykgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgICAgIHN0cmljdCA9IGxhbmc7XHJcbiAgICAgICAgICAgIGxhbmcgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIG9iamVjdCBjb25zdHJ1Y3Rpb24gbXVzdCBiZSBkb25lIHRoaXMgd2F5LlxyXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNDIzXHJcbiAgICAgICAgYyA9IHt9O1xyXG4gICAgICAgIGMuX2lzQU1vbWVudE9iamVjdCA9IHRydWU7XHJcbiAgICAgICAgYy5faSA9IGlucHV0O1xyXG4gICAgICAgIGMuX2YgPSBmb3JtYXQ7XHJcbiAgICAgICAgYy5fbCA9IGxhbmc7XHJcbiAgICAgICAgYy5fc3RyaWN0ID0gc3RyaWN0O1xyXG4gICAgICAgIGMuX2lzVVRDID0gZmFsc2U7XHJcbiAgICAgICAgYy5fcGYgPSBkZWZhdWx0UGFyc2luZ0ZsYWdzKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBtYWtlTW9tZW50KGMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb21lbnQuc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID0gZmFsc2U7XHJcblxyXG4gICAgbW9tZW50LmNyZWF0ZUZyb21JbnB1dEZhbGxiYWNrID0gZGVwcmVjYXRlKFxyXG4gICAgICAgICAgICBcIm1vbWVudCBjb25zdHJ1Y3Rpb24gZmFsbHMgYmFjayB0byBqcyBEYXRlLiBUaGlzIGlzIFwiICtcclxuICAgICAgICAgICAgXCJkaXNjb3VyYWdlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIHVwY29taW5nIG1ham9yIFwiICtcclxuICAgICAgICAgICAgXCJyZWxlYXNlLiBQbGVhc2UgcmVmZXIgdG8gXCIgK1xyXG4gICAgICAgICAgICBcImh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNDA3IGZvciBtb3JlIGluZm8uXCIsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIChjb25maWcpIHtcclxuICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShjb25maWcuX2kpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUGljayBhIG1vbWVudCBtIGZyb20gbW9tZW50cyBzbyB0aGF0IG1bZm5dKG90aGVyKSBpcyB0cnVlIGZvciBhbGxcclxuICAgIC8vIG90aGVyLiBUaGlzIHJlbGllcyBvbiB0aGUgZnVuY3Rpb24gZm4gdG8gYmUgdHJhbnNpdGl2ZS5cclxuICAgIC8vXHJcbiAgICAvLyBtb21lbnRzIHNob3VsZCBlaXRoZXIgYmUgYW4gYXJyYXkgb2YgbW9tZW50IG9iamVjdHMgb3IgYW4gYXJyYXksIHdob3NlXHJcbiAgICAvLyBmaXJzdCBlbGVtZW50IGlzIGFuIGFycmF5IG9mIG1vbWVudCBvYmplY3RzLlxyXG4gICAgZnVuY3Rpb24gcGlja0J5KGZuLCBtb21lbnRzKSB7XHJcbiAgICAgICAgdmFyIHJlcywgaTtcclxuICAgICAgICBpZiAobW9tZW50cy5sZW5ndGggPT09IDEgJiYgaXNBcnJheShtb21lbnRzWzBdKSkge1xyXG4gICAgICAgICAgICBtb21lbnRzID0gbW9tZW50c1swXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFtb21lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlcyA9IG1vbWVudHNbMF07XHJcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IG1vbWVudHMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgaWYgKG1vbWVudHNbaV1bZm5dKHJlcykpIHtcclxuICAgICAgICAgICAgICAgIHJlcyA9IG1vbWVudHNbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH1cclxuXHJcbiAgICBtb21lbnQubWluID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xyXG5cclxuICAgICAgICByZXR1cm4gcGlja0J5KCdpc0JlZm9yZScsIGFyZ3MpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb21lbnQubWF4ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xyXG5cclxuICAgICAgICByZXR1cm4gcGlja0J5KCdpc0FmdGVyJywgYXJncyk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGNyZWF0aW5nIHdpdGggdXRjXHJcbiAgICBtb21lbnQudXRjID0gZnVuY3Rpb24gKGlucHV0LCBmb3JtYXQsIGxhbmcsIHN0cmljdCkge1xyXG4gICAgICAgIHZhciBjO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mKGxhbmcpID09PSBcImJvb2xlYW5cIikge1xyXG4gICAgICAgICAgICBzdHJpY3QgPSBsYW5nO1xyXG4gICAgICAgICAgICBsYW5nID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cclxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTQyM1xyXG4gICAgICAgIGMgPSB7fTtcclxuICAgICAgICBjLl9pc0FNb21lbnRPYmplY3QgPSB0cnVlO1xyXG4gICAgICAgIGMuX3VzZVVUQyA9IHRydWU7XHJcbiAgICAgICAgYy5faXNVVEMgPSB0cnVlO1xyXG4gICAgICAgIGMuX2wgPSBsYW5nO1xyXG4gICAgICAgIGMuX2kgPSBpbnB1dDtcclxuICAgICAgICBjLl9mID0gZm9ybWF0O1xyXG4gICAgICAgIGMuX3N0cmljdCA9IHN0cmljdDtcclxuICAgICAgICBjLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG1ha2VNb21lbnQoYykudXRjKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGNyZWF0aW5nIHdpdGggdW5peCB0aW1lc3RhbXAgKGluIHNlY29uZHMpXHJcbiAgICBtb21lbnQudW5peCA9IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgIHJldHVybiBtb21lbnQoaW5wdXQgKiAxMDAwKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gZHVyYXRpb25cclxuICAgIG1vbWVudC5kdXJhdGlvbiA9IGZ1bmN0aW9uIChpbnB1dCwga2V5KSB7XHJcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gaW5wdXQsXHJcbiAgICAgICAgICAgIC8vIG1hdGNoaW5nIGFnYWluc3QgcmVnZXhwIGlzIGV4cGVuc2l2ZSwgZG8gaXQgb24gZGVtYW5kXHJcbiAgICAgICAgICAgIG1hdGNoID0gbnVsbCxcclxuICAgICAgICAgICAgc2lnbixcclxuICAgICAgICAgICAgcmV0LFxyXG4gICAgICAgICAgICBwYXJzZUlzbztcclxuXHJcbiAgICAgICAgaWYgKG1vbWVudC5pc0R1cmF0aW9uKGlucHV0KSkge1xyXG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgIG1zOiBpbnB1dC5fbWlsbGlzZWNvbmRzLFxyXG4gICAgICAgICAgICAgICAgZDogaW5wdXQuX2RheXMsXHJcbiAgICAgICAgICAgICAgICBNOiBpbnB1dC5fbW9udGhzXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge307XHJcbiAgICAgICAgICAgIGlmIChrZXkpIHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uW2tleV0gPSBpbnB1dDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uLm1pbGxpc2Vjb25kcyA9IGlucHV0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGFzcE5ldFRpbWVTcGFuSnNvblJlZ2V4LmV4ZWMoaW5wdXQpKSkge1xyXG4gICAgICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSBcIi1cIikgPyAtMSA6IDE7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge1xyXG4gICAgICAgICAgICAgICAgeTogMCxcclxuICAgICAgICAgICAgICAgIGQ6IHRvSW50KG1hdGNoW0RBVEVdKSAqIHNpZ24sXHJcbiAgICAgICAgICAgICAgICBoOiB0b0ludChtYXRjaFtIT1VSXSkgKiBzaWduLFxyXG4gICAgICAgICAgICAgICAgbTogdG9JbnQobWF0Y2hbTUlOVVRFXSkgKiBzaWduLFxyXG4gICAgICAgICAgICAgICAgczogdG9JbnQobWF0Y2hbU0VDT05EXSkgKiBzaWduLFxyXG4gICAgICAgICAgICAgICAgbXM6IHRvSW50KG1hdGNoW01JTExJU0VDT05EXSkgKiBzaWduXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGlzb0R1cmF0aW9uUmVnZXguZXhlYyhpbnB1dCkpKSB7XHJcbiAgICAgICAgICAgIHNpZ24gPSAobWF0Y2hbMV0gPT09IFwiLVwiKSA/IC0xIDogMTtcclxuICAgICAgICAgICAgcGFyc2VJc28gPSBmdW5jdGlvbiAoaW5wKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSdkIG5vcm1hbGx5IHVzZSB+fmlucCBmb3IgdGhpcywgYnV0IHVuZm9ydHVuYXRlbHkgaXQgYWxzb1xyXG4gICAgICAgICAgICAgICAgLy8gY29udmVydHMgZmxvYXRzIHRvIGludHMuXHJcbiAgICAgICAgICAgICAgICAvLyBpbnAgbWF5IGJlIHVuZGVmaW5lZCwgc28gY2FyZWZ1bCBjYWxsaW5nIHJlcGxhY2Ugb24gaXQuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzID0gaW5wICYmIHBhcnNlRmxvYXQoaW5wLnJlcGxhY2UoJywnLCAnLicpKTtcclxuICAgICAgICAgICAgICAgIC8vIGFwcGx5IHNpZ24gd2hpbGUgd2UncmUgYXQgaXRcclxuICAgICAgICAgICAgICAgIHJldHVybiAoaXNOYU4ocmVzKSA/IDAgOiByZXMpICogc2lnbjtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgZHVyYXRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICB5OiBwYXJzZUlzbyhtYXRjaFsyXSksXHJcbiAgICAgICAgICAgICAgICBNOiBwYXJzZUlzbyhtYXRjaFszXSksXHJcbiAgICAgICAgICAgICAgICBkOiBwYXJzZUlzbyhtYXRjaFs0XSksXHJcbiAgICAgICAgICAgICAgICBoOiBwYXJzZUlzbyhtYXRjaFs1XSksXHJcbiAgICAgICAgICAgICAgICBtOiBwYXJzZUlzbyhtYXRjaFs2XSksXHJcbiAgICAgICAgICAgICAgICBzOiBwYXJzZUlzbyhtYXRjaFs3XSksXHJcbiAgICAgICAgICAgICAgICB3OiBwYXJzZUlzbyhtYXRjaFs4XSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldCA9IG5ldyBEdXJhdGlvbihkdXJhdGlvbik7XHJcblxyXG4gICAgICAgIGlmIChtb21lbnQuaXNEdXJhdGlvbihpbnB1dCkgJiYgaW5wdXQuaGFzT3duUHJvcGVydHkoJ19sYW5nJykpIHtcclxuICAgICAgICAgICAgcmV0Ll9sYW5nID0gaW5wdXQuX2xhbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyB2ZXJzaW9uIG51bWJlclxyXG4gICAgbW9tZW50LnZlcnNpb24gPSBWRVJTSU9OO1xyXG5cclxuICAgIC8vIGRlZmF1bHQgZm9ybWF0XHJcbiAgICBtb21lbnQuZGVmYXVsdEZvcm1hdCA9IGlzb0Zvcm1hdDtcclxuXHJcbiAgICAvLyBjb25zdGFudCB0aGF0IHJlZmVycyB0byB0aGUgSVNPIHN0YW5kYXJkXHJcbiAgICBtb21lbnQuSVNPXzg2MDEgPSBmdW5jdGlvbiAoKSB7fTtcclxuXHJcbiAgICAvLyBQbHVnaW5zIHRoYXQgYWRkIHByb3BlcnRpZXMgc2hvdWxkIGFsc28gYWRkIHRoZSBrZXkgaGVyZSAobnVsbCB2YWx1ZSksXHJcbiAgICAvLyBzbyB3ZSBjYW4gcHJvcGVybHkgY2xvbmUgb3Vyc2VsdmVzLlxyXG4gICAgbW9tZW50Lm1vbWVudFByb3BlcnRpZXMgPSBtb21lbnRQcm9wZXJ0aWVzO1xyXG5cclxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgYSBtb21lbnQgaXMgbXV0YXRlZC5cclxuICAgIC8vIEl0IGlzIGludGVuZGVkIHRvIGtlZXAgdGhlIG9mZnNldCBpbiBzeW5jIHdpdGggdGhlIHRpbWV6b25lLlxyXG4gICAgbW9tZW50LnVwZGF0ZU9mZnNldCA9IGZ1bmN0aW9uICgpIHt9O1xyXG5cclxuICAgIC8vIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBzZXQgYSB0aHJlc2hvbGQgZm9yIHJlbGF0aXZlIHRpbWUgc3RyaW5nc1xyXG4gICAgbW9tZW50LnJlbGF0aXZlVGltZVRocmVzaG9sZCA9IGZ1bmN0aW9uKHRocmVzaG9sZCwgbGltaXQpIHtcclxuICAgICAgaWYgKHJlbGF0aXZlVGltZVRocmVzaG9sZHNbdGhyZXNob2xkXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIHJlbGF0aXZlVGltZVRocmVzaG9sZHNbdGhyZXNob2xkXSA9IGxpbWl0O1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGxvYWQgbGFuZ3VhZ2VzIGFuZCB0aGVuIHNldCB0aGUgZ2xvYmFsIGxhbmd1YWdlLiAgSWZcclxuICAgIC8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnQgZ2xvYmFsXHJcbiAgICAvLyBsYW5ndWFnZSBrZXkuXHJcbiAgICBtb21lbnQubGFuZyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlcykge1xyXG4gICAgICAgIHZhciByO1xyXG4gICAgICAgIGlmICgha2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuZm4uX2xhbmcuX2FiYnI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh2YWx1ZXMpIHtcclxuICAgICAgICAgICAgbG9hZExhbmcobm9ybWFsaXplTGFuZ3VhZ2Uoa2V5KSwgdmFsdWVzKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlcyA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICB1bmxvYWRMYW5nKGtleSk7XHJcbiAgICAgICAgICAgIGtleSA9ICdlbic7XHJcbiAgICAgICAgfSBlbHNlIGlmICghbGFuZ3VhZ2VzW2tleV0pIHtcclxuICAgICAgICAgICAgZ2V0TGFuZ0RlZmluaXRpb24oa2V5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgciA9IG1vbWVudC5kdXJhdGlvbi5mbi5fbGFuZyA9IG1vbWVudC5mbi5fbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGtleSk7XHJcbiAgICAgICAgcmV0dXJuIHIuX2FiYnI7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIHJldHVybnMgbGFuZ3VhZ2UgZGF0YVxyXG4gICAgbW9tZW50LmxhbmdEYXRhID0gZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgIGlmIChrZXkgJiYga2V5Ll9sYW5nICYmIGtleS5fbGFuZy5fYWJicikge1xyXG4gICAgICAgICAgICBrZXkgPSBrZXkuX2xhbmcuX2FiYnI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBnZXRMYW5nRGVmaW5pdGlvbihrZXkpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBjb21wYXJlIG1vbWVudCBvYmplY3RcclxuICAgIG1vbWVudC5pc01vbWVudCA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgTW9tZW50IHx8XHJcbiAgICAgICAgICAgIChvYmogIT0gbnVsbCAmJiAgb2JqLmhhc093blByb3BlcnR5KCdfaXNBTW9tZW50T2JqZWN0JykpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBmb3IgdHlwZWNoZWNraW5nIER1cmF0aW9uIG9iamVjdHNcclxuICAgIG1vbWVudC5pc0R1cmF0aW9uID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEdXJhdGlvbjtcclxuICAgIH07XHJcblxyXG4gICAgZm9yIChpID0gbGlzdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcclxuICAgICAgICBtYWtlTGlzdChsaXN0c1tpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW9tZW50Lm5vcm1hbGl6ZVVuaXRzID0gZnVuY3Rpb24gKHVuaXRzKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcclxuICAgIH07XHJcblxyXG4gICAgbW9tZW50LmludmFsaWQgPSBmdW5jdGlvbiAoZmxhZ3MpIHtcclxuICAgICAgICB2YXIgbSA9IG1vbWVudC51dGMoTmFOKTtcclxuICAgICAgICBpZiAoZmxhZ3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBleHRlbmQobS5fcGYsIGZsYWdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG0uX3BmLnVzZXJJbnZhbGlkYXRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbTtcclxuICAgIH07XHJcblxyXG4gICAgbW9tZW50LnBhcnNlWm9uZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbW9tZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cykucGFyc2Vab25lKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vbWVudC5wYXJzZVR3b0RpZ2l0WWVhciA9IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgIHJldHVybiB0b0ludChpbnB1dCkgKyAodG9JbnQoaW5wdXQpID4gNjggPyAxOTAwIDogMjAwMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBNb21lbnQgUHJvdG90eXBlXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIGV4dGVuZChtb21lbnQuZm4gPSBNb21lbnQucHJvdG90eXBlLCB7XHJcblxyXG4gICAgICAgIGNsb25lIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlT2YgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiArdGhpcy5fZCArICgodGhpcy5fb2Zmc2V0IHx8IDApICogNjAwMDApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHVuaXggOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKCt0aGlzIC8gMTAwMCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNsb25lKCkubGFuZygnZW4nKS5mb3JtYXQoXCJkZGQgTU1NIEREIFlZWVkgSEg6bW06c3MgW0dNVF1aWlwiKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b0RhdGUgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vZmZzZXQgPyBuZXcgRGF0ZSgrdGhpcykgOiB0aGlzLl9kO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRvSVNPU3RyaW5nIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgbSA9IG1vbWVudCh0aGlzKS51dGMoKTtcclxuICAgICAgICAgICAgaWYgKDAgPCBtLnllYXIoKSAmJiBtLnllYXIoKSA8PSA5OTk5KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9ybWF0TW9tZW50KG0sICdZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9ybWF0TW9tZW50KG0sICdZWVlZWVktTU0tRERbVF1ISDptbTpzcy5TU1NbWl0nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRvQXJyYXkgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBtID0gdGhpcztcclxuICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgIG0ueWVhcigpLFxyXG4gICAgICAgICAgICAgICAgbS5tb250aCgpLFxyXG4gICAgICAgICAgICAgICAgbS5kYXRlKCksXHJcbiAgICAgICAgICAgICAgICBtLmhvdXJzKCksXHJcbiAgICAgICAgICAgICAgICBtLm1pbnV0ZXMoKSxcclxuICAgICAgICAgICAgICAgIG0uc2Vjb25kcygpLFxyXG4gICAgICAgICAgICAgICAgbS5taWxsaXNlY29uZHMoKVxyXG4gICAgICAgICAgICBdO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzVmFsaWQgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc1ZhbGlkKHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzRFNUU2hpZnRlZCA6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9hKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgJiYgY29tcGFyZUFycmF5cyh0aGlzLl9hLCAodGhpcy5faXNVVEMgPyBtb21lbnQudXRjKHRoaXMuX2EpIDogbW9tZW50KHRoaXMuX2EpKS50b0FycmF5KCkpID4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhcnNpbmdGbGFncyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGV4dGVuZCh7fSwgdGhpcy5fcGYpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGludmFsaWRBdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGYub3ZlcmZsb3c7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdXRjIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy56b25lKDApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGxvY2FsIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLnpvbmUoMCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2lzVVRDID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZvcm1hdCA6IGZ1bmN0aW9uIChpbnB1dFN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gZm9ybWF0TW9tZW50KHRoaXMsIGlucHV0U3RyaW5nIHx8IG1vbWVudC5kZWZhdWx0Rm9ybWF0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLnBvc3Rmb3JtYXQob3V0cHV0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZGQgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xyXG4gICAgICAgICAgICB2YXIgZHVyO1xyXG4gICAgICAgICAgICAvLyBzd2l0Y2ggYXJncyB0byBzdXBwb3J0IGFkZCgncycsIDEpIGFuZCBhZGQoMSwgJ3MnKVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgZHVyID0gbW9tZW50LmR1cmF0aW9uKGlzTmFOKCt2YWwpID8gK2lucHV0IDogK3ZhbCwgaXNOYU4oK3ZhbCkgPyB2YWwgOiBpbnB1dCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgZHVyID0gbW9tZW50LmR1cmF0aW9uKCt2YWwsIGlucHV0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhZGRPclN1YnRyYWN0RHVyYXRpb25Gcm9tTW9tZW50KHRoaXMsIGR1ciwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN1YnRyYWN0IDogZnVuY3Rpb24gKGlucHV0LCB2YWwpIHtcclxuICAgICAgICAgICAgdmFyIGR1cjtcclxuICAgICAgICAgICAgLy8gc3dpdGNoIGFyZ3MgdG8gc3VwcG9ydCBzdWJ0cmFjdCgncycsIDEpIGFuZCBzdWJ0cmFjdCgxLCAncycpXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICBkdXIgPSBtb21lbnQuZHVyYXRpb24oaXNOYU4oK3ZhbCkgPyAraW5wdXQgOiArdmFsLCBpc05hTigrdmFsKSA/IHZhbCA6IGlucHV0KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICBkdXIgPSBtb21lbnQuZHVyYXRpb24oK3ZhbCwgaW5wdXQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZHVyID0gbW9tZW50LmR1cmF0aW9uKGlucHV0LCB2YWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGFkZE9yU3VidHJhY3REdXJhdGlvbkZyb21Nb21lbnQodGhpcywgZHVyLCAtMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGRpZmYgOiBmdW5jdGlvbiAoaW5wdXQsIHVuaXRzLCBhc0Zsb2F0KSB7XHJcbiAgICAgICAgICAgIHZhciB0aGF0ID0gbWFrZUFzKGlucHV0LCB0aGlzKSxcclxuICAgICAgICAgICAgICAgIHpvbmVEaWZmID0gKHRoaXMuem9uZSgpIC0gdGhhdC56b25lKCkpICogNmU0LFxyXG4gICAgICAgICAgICAgICAgZGlmZiwgb3V0cHV0O1xyXG5cclxuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICd5ZWFyJyB8fCB1bml0cyA9PT0gJ21vbnRoJykge1xyXG4gICAgICAgICAgICAgICAgLy8gYXZlcmFnZSBudW1iZXIgb2YgZGF5cyBpbiB0aGUgbW9udGhzIGluIHRoZSBnaXZlbiBkYXRlc1xyXG4gICAgICAgICAgICAgICAgZGlmZiA9ICh0aGlzLmRheXNJbk1vbnRoKCkgKyB0aGF0LmRheXNJbk1vbnRoKCkpICogNDMyZTU7IC8vIDI0ICogNjAgKiA2MCAqIDEwMDAgLyAyXHJcbiAgICAgICAgICAgICAgICAvLyBkaWZmZXJlbmNlIGluIG1vbnRoc1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gKCh0aGlzLnllYXIoKSAtIHRoYXQueWVhcigpKSAqIDEyKSArICh0aGlzLm1vbnRoKCkgLSB0aGF0Lm1vbnRoKCkpO1xyXG4gICAgICAgICAgICAgICAgLy8gYWRqdXN0IGJ5IHRha2luZyBkaWZmZXJlbmNlIGluIGRheXMsIGF2ZXJhZ2UgbnVtYmVyIG9mIGRheXNcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBkc3QgaW4gdGhlIGdpdmVuIG1vbnRocy5cclxuICAgICAgICAgICAgICAgIG91dHB1dCArPSAoKHRoaXMgLSBtb21lbnQodGhpcykuc3RhcnRPZignbW9udGgnKSkgLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAodGhhdCAtIG1vbWVudCh0aGF0KS5zdGFydE9mKCdtb250aCcpKSkgLyBkaWZmO1xyXG4gICAgICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2l0aCB6b25lcywgdG8gbmVnYXRlIGFsbCBkc3RcclxuICAgICAgICAgICAgICAgIG91dHB1dCAtPSAoKHRoaXMuem9uZSgpIC0gbW9tZW50KHRoaXMpLnN0YXJ0T2YoJ21vbnRoJykuem9uZSgpKSAtXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGF0LnpvbmUoKSAtIG1vbWVudCh0aGF0KS5zdGFydE9mKCdtb250aCcpLnpvbmUoKSkpICogNmU0IC8gZGlmZjtcclxuICAgICAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ3llYXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0IC8gMTI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkaWZmID0gKHRoaXMgLSB0aGF0KTtcclxuICAgICAgICAgICAgICAgIG91dHB1dCA9IHVuaXRzID09PSAnc2Vjb25kJyA/IGRpZmYgLyAxZTMgOiAvLyAxMDAwXHJcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICdtaW51dGUnID8gZGlmZiAvIDZlNCA6IC8vIDEwMDAgKiA2MFxyXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnaG91cicgPyBkaWZmIC8gMzZlNSA6IC8vIDEwMDAgKiA2MCAqIDYwXHJcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICdkYXknID8gKGRpZmYgLSB6b25lRGlmZikgLyA4NjRlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQsIG5lZ2F0ZSBkc3RcclxuICAgICAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ3dlZWsnID8gKGRpZmYgLSB6b25lRGlmZikgLyA2MDQ4ZTUgOiAvLyAxMDAwICogNjAgKiA2MCAqIDI0ICogNywgbmVnYXRlIGRzdFxyXG4gICAgICAgICAgICAgICAgICAgIGRpZmY7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFzRmxvYXQgPyBvdXRwdXQgOiBhYnNSb3VuZChvdXRwdXQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZyb20gOiBmdW5jdGlvbiAodGltZSwgd2l0aG91dFN1ZmZpeCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmR1cmF0aW9uKHRoaXMuZGlmZih0aW1lKSkubGFuZyh0aGlzLmxhbmcoKS5fYWJicikuaHVtYW5pemUoIXdpdGhvdXRTdWZmaXgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZyb21Ob3cgOiBmdW5jdGlvbiAod2l0aG91dFN1ZmZpeCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mcm9tKG1vbWVudCgpLCB3aXRob3V0U3VmZml4KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBjYWxlbmRhciA6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgdG8gY29tcGFyZSB0aGUgc3RhcnQgb2YgdG9kYXksIHZzIHRoaXMuXHJcbiAgICAgICAgICAgIC8vIEdldHRpbmcgc3RhcnQtb2YtdG9kYXkgZGVwZW5kcyBvbiB3aGV0aGVyIHdlJ3JlIHpvbmUnZCBvciBub3QuXHJcbiAgICAgICAgICAgIHZhciBub3cgPSB0aW1lIHx8IG1vbWVudCgpLFxyXG4gICAgICAgICAgICAgICAgc29kID0gbWFrZUFzKG5vdywgdGhpcykuc3RhcnRPZignZGF5JyksXHJcbiAgICAgICAgICAgICAgICBkaWZmID0gdGhpcy5kaWZmKHNvZCwgJ2RheXMnLCB0cnVlKSxcclxuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGRpZmYgPCAtNiA/ICdzYW1lRWxzZScgOlxyXG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAtMSA/ICdsYXN0V2VlaycgOlxyXG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAwID8gJ2xhc3REYXknIDpcclxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgMSA/ICdzYW1lRGF5JyA6XHJcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IDIgPyAnbmV4dERheScgOlxyXG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCA3ID8gJ25leHRXZWVrJyA6ICdzYW1lRWxzZSc7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZvcm1hdCh0aGlzLmxhbmcoKS5jYWxlbmRhcihmb3JtYXQsIHRoaXMpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc0xlYXBZZWFyIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNMZWFwWWVhcih0aGlzLnllYXIoKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNEU1QgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAodGhpcy56b25lKCkgPCB0aGlzLmNsb25lKCkubW9udGgoMCkuem9uZSgpIHx8XHJcbiAgICAgICAgICAgICAgICB0aGlzLnpvbmUoKSA8IHRoaXMuY2xvbmUoKS5tb250aCg1KS56b25lKCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGRheSA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICB2YXIgZGF5ID0gdGhpcy5faXNVVEMgPyB0aGlzLl9kLmdldFVUQ0RheSgpIDogdGhpcy5fZC5nZXREYXkoKTtcclxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlucHV0ID0gcGFyc2VXZWVrZGF5KGlucHV0LCB0aGlzLmxhbmcoKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoeyBkIDogaW5wdXQgLSBkYXkgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF5O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbW9udGggOiBtYWtlQWNjZXNzb3IoJ01vbnRoJywgdHJ1ZSksXHJcblxyXG4gICAgICAgIHN0YXJ0T2Y6IGZ1bmN0aW9uICh1bml0cykge1xyXG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcclxuICAgICAgICAgICAgLy8gdGhlIGZvbGxvd2luZyBzd2l0Y2ggaW50ZW50aW9uYWxseSBvbWl0cyBicmVhayBrZXl3b3Jkc1xyXG4gICAgICAgICAgICAvLyB0byB1dGlsaXplIGZhbGxpbmcgdGhyb3VnaCB0aGUgY2FzZXMuXHJcbiAgICAgICAgICAgIHN3aXRjaCAodW5pdHMpIHtcclxuICAgICAgICAgICAgY2FzZSAneWVhcic6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vbnRoKDApO1xyXG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xyXG4gICAgICAgICAgICBjYXNlICdxdWFydGVyJzpcclxuICAgICAgICAgICAgY2FzZSAnbW9udGgnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRlKDEpO1xyXG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xyXG4gICAgICAgICAgICBjYXNlICd3ZWVrJzpcclxuICAgICAgICAgICAgY2FzZSAnaXNvV2Vlayc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2RheSc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhvdXJzKDApO1xyXG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xyXG4gICAgICAgICAgICBjYXNlICdob3VyJzpcclxuICAgICAgICAgICAgICAgIHRoaXMubWludXRlcygwKTtcclxuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICAgICAgY2FzZSAnbWludXRlJzpcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Vjb25kcygwKTtcclxuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICAgICAgY2FzZSAnc2Vjb25kJzpcclxuICAgICAgICAgICAgICAgIHRoaXMubWlsbGlzZWNvbmRzKDApO1xyXG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyB3ZWVrcyBhcmUgYSBzcGVjaWFsIGNhc2VcclxuICAgICAgICAgICAgaWYgKHVuaXRzID09PSAnd2VlaycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2Vla2RheSgwKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh1bml0cyA9PT0gJ2lzb1dlZWsnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzb1dlZWtkYXkoMSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHF1YXJ0ZXJzIGFyZSBhbHNvIHNwZWNpYWxcclxuICAgICAgICAgICAgaWYgKHVuaXRzID09PSAncXVhcnRlcicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9udGgoTWF0aC5mbG9vcih0aGlzLm1vbnRoKCkgLyAzKSAqIDMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlbmRPZjogZnVuY3Rpb24gKHVuaXRzKSB7XHJcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGFydE9mKHVuaXRzKS5hZGQoKHVuaXRzID09PSAnaXNvV2VlaycgPyAnd2VlaycgOiB1bml0cyksIDEpLnN1YnRyYWN0KCdtcycsIDEpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzQWZ0ZXI6IGZ1bmN0aW9uIChpbnB1dCwgdW5pdHMpIHtcclxuICAgICAgICAgICAgdW5pdHMgPSB0eXBlb2YgdW5pdHMgIT09ICd1bmRlZmluZWQnID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnO1xyXG4gICAgICAgICAgICByZXR1cm4gK3RoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKSA+ICttb21lbnQoaW5wdXQpLnN0YXJ0T2YodW5pdHMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzQmVmb3JlOiBmdW5jdGlvbiAoaW5wdXQsIHVuaXRzKSB7XHJcbiAgICAgICAgICAgIHVuaXRzID0gdHlwZW9mIHVuaXRzICE9PSAndW5kZWZpbmVkJyA/IHVuaXRzIDogJ21pbGxpc2Vjb25kJztcclxuICAgICAgICAgICAgcmV0dXJuICt0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykgPCArbW9tZW50KGlucHV0KS5zdGFydE9mKHVuaXRzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc1NhbWU6IGZ1bmN0aW9uIChpbnB1dCwgdW5pdHMpIHtcclxuICAgICAgICAgICAgdW5pdHMgPSB1bml0cyB8fCAnbXMnO1xyXG4gICAgICAgICAgICByZXR1cm4gK3RoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKSA9PT0gK21ha2VBcyhpbnB1dCwgdGhpcykuc3RhcnRPZih1bml0cyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbWluOiBkZXByZWNhdGUoXHJcbiAgICAgICAgICAgICAgICAgXCJtb21lbnQoKS5taW4gaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudC5taW4gaW5zdGVhZC4gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE1NDhcIixcclxuICAgICAgICAgICAgICAgICBmdW5jdGlvbiAob3RoZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgb3RoZXIgPSBtb21lbnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG90aGVyIDwgdGhpcyA/IHRoaXMgOiBvdGhlcjtcclxuICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICksXHJcblxyXG4gICAgICAgIG1heDogZGVwcmVjYXRlKFxyXG4gICAgICAgICAgICAgICAgXCJtb21lbnQoKS5tYXggaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudC5tYXggaW5zdGVhZC4gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE1NDhcIixcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChvdGhlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIG90aGVyID0gbW9tZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG90aGVyID4gdGhpcyA/IHRoaXMgOiBvdGhlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICApLFxyXG5cclxuICAgICAgICAvLyBrZWVwVGltZSA9IHRydWUgbWVhbnMgb25seSBjaGFuZ2UgdGhlIHRpbWV6b25lLCB3aXRob3V0IGFmZmVjdGluZ1xyXG4gICAgICAgIC8vIHRoZSBsb2NhbCBob3VyLiBTbyA1OjMxOjI2ICswMzAwIC0tW3pvbmUoMiwgdHJ1ZSldLS0+IDU6MzE6MjYgKzAyMDBcclxuICAgICAgICAvLyBJdCBpcyBwb3NzaWJsZSB0aGF0IDU6MzE6MjYgZG9lc24ndCBleGlzdCBpbnQgem9uZSArMDIwMCwgc28gd2VcclxuICAgICAgICAvLyBhZGp1c3QgdGhlIHRpbWUgYXMgbmVlZGVkLCB0byBiZSB2YWxpZC5cclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIEtlZXBpbmcgdGhlIHRpbWUgYWN0dWFsbHkgYWRkcy9zdWJ0cmFjdHMgKG9uZSBob3VyKVxyXG4gICAgICAgIC8vIGZyb20gdGhlIGFjdHVhbCByZXByZXNlbnRlZCB0aW1lLiBUaGF0IGlzIHdoeSB3ZSBjYWxsIHVwZGF0ZU9mZnNldFxyXG4gICAgICAgIC8vIGEgc2Vjb25kIHRpbWUuIEluIGNhc2UgaXQgd2FudHMgdXMgdG8gY2hhbmdlIHRoZSBvZmZzZXQgYWdhaW5cclxuICAgICAgICAvLyBfY2hhbmdlSW5Qcm9ncmVzcyA9PSB0cnVlIGNhc2UsIHRoZW4gd2UgaGF2ZSB0byBhZGp1c3QsIGJlY2F1c2VcclxuICAgICAgICAvLyB0aGVyZSBpcyBubyBzdWNoIHRpbWUgaW4gdGhlIGdpdmVuIHRpbWV6b25lLlxyXG4gICAgICAgIHpvbmUgOiBmdW5jdGlvbiAoaW5wdXQsIGtlZXBUaW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLl9vZmZzZXQgfHwgMDtcclxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IHRpbWV6b25lTWludXRlc0Zyb21TdHJpbmcoaW5wdXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGlucHV0KSA8IDE2KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSBpbnB1dCAqIDYwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fb2Zmc2V0ID0gaW5wdXQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9pc1VUQyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ICE9PSBpbnB1dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgha2VlcFRpbWUgfHwgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRPclN1YnRyYWN0RHVyYXRpb25Gcm9tTW9tZW50KHRoaXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9tZW50LmR1cmF0aW9uKG9mZnNldCAtIGlucHV0LCAnbScpLCAxLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jaGFuZ2VJblByb2dyZXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9tZW50LnVwZGF0ZU9mZnNldCh0aGlzLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcyA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gb2Zmc2V0IDogdGhpcy5fZC5nZXRUaW1lem9uZU9mZnNldCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHpvbmVBYmJyIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBcIlVUQ1wiIDogXCJcIjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB6b25lTmFtZSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gXCJDb29yZGluYXRlZCBVbml2ZXJzYWwgVGltZVwiIDogXCJcIjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwYXJzZVpvbmUgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl90em0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuem9uZSh0aGlzLl90em0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLl9pID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy56b25lKHRoaXMuX2kpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhhc0FsaWduZWRIb3VyT2Zmc2V0IDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIGlmICghaW5wdXQpIHtcclxuICAgICAgICAgICAgICAgIGlucHV0ID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlucHV0ID0gbW9tZW50KGlucHV0KS56b25lKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiAodGhpcy56b25lKCkgLSBpbnB1dCkgJSA2MCA9PT0gMDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBkYXlzSW5Nb250aCA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGRheXNJbk1vbnRoKHRoaXMueWVhcigpLCB0aGlzLm1vbnRoKCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGRheU9mWWVhciA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICB2YXIgZGF5T2ZZZWFyID0gcm91bmQoKG1vbWVudCh0aGlzKS5zdGFydE9mKCdkYXknKSAtIG1vbWVudCh0aGlzKS5zdGFydE9mKCd5ZWFyJykpIC8gODY0ZTUpICsgMTtcclxuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBkYXlPZlllYXIgOiB0aGlzLmFkZChcImRcIiwgKGlucHV0IC0gZGF5T2ZZZWFyKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcXVhcnRlciA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IE1hdGguY2VpbCgodGhpcy5tb250aCgpICsgMSkgLyAzKSA6IHRoaXMubW9udGgoKGlucHV0IC0gMSkgKiAzICsgdGhpcy5tb250aCgpICUgMyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgd2Vla1llYXIgOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgdmFyIHllYXIgPSB3ZWVrT2ZZZWFyKHRoaXMsIHRoaXMubGFuZygpLl93ZWVrLmRvdywgdGhpcy5sYW5nKCkuX3dlZWsuZG95KS55ZWFyO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHllYXIgOiB0aGlzLmFkZChcInlcIiwgKGlucHV0IC0geWVhcikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzb1dlZWtZZWFyIDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIHZhciB5ZWFyID0gd2Vla09mWWVhcih0aGlzLCAxLCA0KS55ZWFyO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHllYXIgOiB0aGlzLmFkZChcInlcIiwgKGlucHV0IC0geWVhcikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHdlZWsgOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgdmFyIHdlZWsgPSB0aGlzLmxhbmcoKS53ZWVrKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZChcImRcIiwgKGlucHV0IC0gd2VlaykgKiA3KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc29XZWVrIDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIHZhciB3ZWVrID0gd2Vla09mWWVhcih0aGlzLCAxLCA0KS53ZWVrO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZChcImRcIiwgKGlucHV0IC0gd2VlaykgKiA3KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB3ZWVrZGF5IDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIHZhciB3ZWVrZGF5ID0gKHRoaXMuZGF5KCkgKyA3IC0gdGhpcy5sYW5nKCkuX3dlZWsuZG93KSAlIDc7XHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2Vla2RheSA6IHRoaXMuYWRkKFwiZFwiLCBpbnB1dCAtIHdlZWtkYXkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzb1dlZWtkYXkgOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgLy8gYmVoYXZlcyB0aGUgc2FtZSBhcyBtb21lbnQjZGF5IGV4Y2VwdFxyXG4gICAgICAgICAgICAvLyBhcyBhIGdldHRlciwgcmV0dXJucyA3IGluc3RlYWQgb2YgMCAoMS03IHJhbmdlIGluc3RlYWQgb2YgMC02KVxyXG4gICAgICAgICAgICAvLyBhcyBhIHNldHRlciwgc3VuZGF5IHNob3VsZCBiZWxvbmcgdG8gdGhlIHByZXZpb3VzIHdlZWsuXHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gdGhpcy5kYXkoKSB8fCA3IDogdGhpcy5kYXkodGhpcy5kYXkoKSAlIDcgPyBpbnB1dCA6IGlucHV0IC0gNyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNvV2Vla3NJblllYXIgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3ZWVrc0luWWVhcih0aGlzLnllYXIoKSwgMSwgNCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgd2Vla3NJblllYXIgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB3ZWVrSW5mbyA9IHRoaXMuX2xhbmcuX3dlZWs7XHJcbiAgICAgICAgICAgIHJldHVybiB3ZWVrc0luWWVhcih0aGlzLnllYXIoKSwgd2Vla0luZm8uZG93LCB3ZWVrSW5mby5kb3kpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGdldCA6IGZ1bmN0aW9uICh1bml0cykge1xyXG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHNdKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0IDogZnVuY3Rpb24gKHVuaXRzLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzW3VuaXRzXSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgdGhpc1t1bml0c10odmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIElmIHBhc3NlZCBhIGxhbmd1YWdlIGtleSwgaXQgd2lsbCBzZXQgdGhlIGxhbmd1YWdlIGZvciB0aGlzXHJcbiAgICAgICAgLy8gaW5zdGFuY2UuICBPdGhlcndpc2UsIGl0IHdpbGwgcmV0dXJuIHRoZSBsYW5ndWFnZSBjb25maWd1cmF0aW9uXHJcbiAgICAgICAgLy8gdmFyaWFibGVzIGZvciB0aGlzIGluc3RhbmNlLlxyXG4gICAgICAgIGxhbmcgOiBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xhbmc7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9sYW5nID0gZ2V0TGFuZ0RlZmluaXRpb24oa2V5KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gcmF3TW9udGhTZXR0ZXIobW9tLCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBkYXlPZk1vbnRoO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBNb3ZlIHRoaXMgb3V0IG9mIGhlcmUhXHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSBtb20ubGFuZygpLm1vbnRoc1BhcnNlKHZhbHVlKTtcclxuICAgICAgICAgICAgLy8gVE9ETzogQW5vdGhlciBzaWxlbnQgZmFpbHVyZT9cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtb207XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRheU9mTW9udGggPSBNYXRoLm1pbihtb20uZGF0ZSgpLFxyXG4gICAgICAgICAgICAgICAgZGF5c0luTW9udGgobW9tLnllYXIoKSwgdmFsdWUpKTtcclxuICAgICAgICBtb20uX2RbJ3NldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgJ01vbnRoJ10odmFsdWUsIGRheU9mTW9udGgpO1xyXG4gICAgICAgIHJldHVybiBtb207XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmF3R2V0dGVyKG1vbSwgdW5pdCkge1xyXG4gICAgICAgIHJldHVybiBtb20uX2RbJ2dldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgdW5pdF0oKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByYXdTZXR0ZXIobW9tLCB1bml0LCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICh1bml0ID09PSAnTW9udGgnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByYXdNb250aFNldHRlcihtb20sIHZhbHVlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbW9tLl9kWydzZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArIHVuaXRdKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZUFjY2Vzc29yKHVuaXQsIGtlZXBUaW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmF3U2V0dGVyKHRoaXMsIHVuaXQsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQodGhpcywga2VlcFRpbWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3R2V0dGVyKHRoaXMsIHVuaXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBtb21lbnQuZm4ubWlsbGlzZWNvbmQgPSBtb21lbnQuZm4ubWlsbGlzZWNvbmRzID0gbWFrZUFjY2Vzc29yKCdNaWxsaXNlY29uZHMnLCBmYWxzZSk7XHJcbiAgICBtb21lbnQuZm4uc2Vjb25kID0gbW9tZW50LmZuLnNlY29uZHMgPSBtYWtlQWNjZXNzb3IoJ1NlY29uZHMnLCBmYWxzZSk7XHJcbiAgICBtb21lbnQuZm4ubWludXRlID0gbW9tZW50LmZuLm1pbnV0ZXMgPSBtYWtlQWNjZXNzb3IoJ01pbnV0ZXMnLCBmYWxzZSk7XHJcbiAgICAvLyBTZXR0aW5nIHRoZSBob3VyIHNob3VsZCBrZWVwIHRoZSB0aW1lLCBiZWNhdXNlIHRoZSB1c2VyIGV4cGxpY2l0bHlcclxuICAgIC8vIHNwZWNpZmllZCB3aGljaCBob3VyIGhlIHdhbnRzLiBTbyB0cnlpbmcgdG8gbWFpbnRhaW4gdGhlIHNhbWUgaG91ciAoaW5cclxuICAgIC8vIGEgbmV3IHRpbWV6b25lKSBtYWtlcyBzZW5zZS4gQWRkaW5nL3N1YnRyYWN0aW5nIGhvdXJzIGRvZXMgbm90IGZvbGxvd1xyXG4gICAgLy8gdGhpcyBydWxlLlxyXG4gICAgbW9tZW50LmZuLmhvdXIgPSBtb21lbnQuZm4uaG91cnMgPSBtYWtlQWNjZXNzb3IoJ0hvdXJzJywgdHJ1ZSk7XHJcbiAgICAvLyBtb21lbnQuZm4ubW9udGggaXMgZGVmaW5lZCBzZXBhcmF0ZWx5XHJcbiAgICBtb21lbnQuZm4uZGF0ZSA9IG1ha2VBY2Nlc3NvcignRGF0ZScsIHRydWUpO1xyXG4gICAgbW9tZW50LmZuLmRhdGVzID0gZGVwcmVjYXRlKFwiZGF0ZXMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIGRhdGUgaW5zdGVhZC5cIiwgbWFrZUFjY2Vzc29yKCdEYXRlJywgdHJ1ZSkpO1xyXG4gICAgbW9tZW50LmZuLnllYXIgPSBtYWtlQWNjZXNzb3IoJ0Z1bGxZZWFyJywgdHJ1ZSk7XHJcbiAgICBtb21lbnQuZm4ueWVhcnMgPSBkZXByZWNhdGUoXCJ5ZWFycyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgeWVhciBpbnN0ZWFkLlwiLCBtYWtlQWNjZXNzb3IoJ0Z1bGxZZWFyJywgdHJ1ZSkpO1xyXG5cclxuICAgIC8vIGFkZCBwbHVyYWwgbWV0aG9kc1xyXG4gICAgbW9tZW50LmZuLmRheXMgPSBtb21lbnQuZm4uZGF5O1xyXG4gICAgbW9tZW50LmZuLm1vbnRocyA9IG1vbWVudC5mbi5tb250aDtcclxuICAgIG1vbWVudC5mbi53ZWVrcyA9IG1vbWVudC5mbi53ZWVrO1xyXG4gICAgbW9tZW50LmZuLmlzb1dlZWtzID0gbW9tZW50LmZuLmlzb1dlZWs7XHJcbiAgICBtb21lbnQuZm4ucXVhcnRlcnMgPSBtb21lbnQuZm4ucXVhcnRlcjtcclxuXHJcbiAgICAvLyBhZGQgYWxpYXNlZCBmb3JtYXQgbWV0aG9kc1xyXG4gICAgbW9tZW50LmZuLnRvSlNPTiA9IG1vbWVudC5mbi50b0lTT1N0cmluZztcclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgRHVyYXRpb24gUHJvdG90eXBlXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIGV4dGVuZChtb21lbnQuZHVyYXRpb24uZm4gPSBEdXJhdGlvbi5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAgICAgX2J1YmJsZSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcyxcclxuICAgICAgICAgICAgICAgIGRheXMgPSB0aGlzLl9kYXlzLFxyXG4gICAgICAgICAgICAgICAgbW9udGhzID0gdGhpcy5fbW9udGhzLFxyXG4gICAgICAgICAgICAgICAgZGF0YSA9IHRoaXMuX2RhdGEsXHJcbiAgICAgICAgICAgICAgICBzZWNvbmRzLCBtaW51dGVzLCBob3VycywgeWVhcnM7XHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGNvZGUgYnViYmxlcyB1cCB2YWx1ZXMsIHNlZSB0aGUgdGVzdHMgZm9yXHJcbiAgICAgICAgICAgIC8vIGV4YW1wbGVzIG9mIHdoYXQgdGhhdCBtZWFucy5cclxuICAgICAgICAgICAgZGF0YS5taWxsaXNlY29uZHMgPSBtaWxsaXNlY29uZHMgJSAxMDAwO1xyXG5cclxuICAgICAgICAgICAgc2Vjb25kcyA9IGFic1JvdW5kKG1pbGxpc2Vjb25kcyAvIDEwMDApO1xyXG4gICAgICAgICAgICBkYXRhLnNlY29uZHMgPSBzZWNvbmRzICUgNjA7XHJcblxyXG4gICAgICAgICAgICBtaW51dGVzID0gYWJzUm91bmQoc2Vjb25kcyAvIDYwKTtcclxuICAgICAgICAgICAgZGF0YS5taW51dGVzID0gbWludXRlcyAlIDYwO1xyXG5cclxuICAgICAgICAgICAgaG91cnMgPSBhYnNSb3VuZChtaW51dGVzIC8gNjApO1xyXG4gICAgICAgICAgICBkYXRhLmhvdXJzID0gaG91cnMgJSAyNDtcclxuXHJcbiAgICAgICAgICAgIGRheXMgKz0gYWJzUm91bmQoaG91cnMgLyAyNCk7XHJcbiAgICAgICAgICAgIGRhdGEuZGF5cyA9IGRheXMgJSAzMDtcclxuXHJcbiAgICAgICAgICAgIG1vbnRocyArPSBhYnNSb3VuZChkYXlzIC8gMzApO1xyXG4gICAgICAgICAgICBkYXRhLm1vbnRocyA9IG1vbnRocyAlIDEyO1xyXG5cclxuICAgICAgICAgICAgeWVhcnMgPSBhYnNSb3VuZChtb250aHMgLyAxMik7XHJcbiAgICAgICAgICAgIGRhdGEueWVhcnMgPSB5ZWFycztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB3ZWVrcyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFic1JvdW5kKHRoaXMuZGF5cygpIC8gNyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21pbGxpc2Vjb25kcyArXHJcbiAgICAgICAgICAgICAgdGhpcy5fZGF5cyAqIDg2NGU1ICtcclxuICAgICAgICAgICAgICAodGhpcy5fbW9udGhzICUgMTIpICogMjU5MmU2ICtcclxuICAgICAgICAgICAgICB0b0ludCh0aGlzLl9tb250aHMgLyAxMikgKiAzMTUzNmU2O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGh1bWFuaXplIDogZnVuY3Rpb24gKHdpdGhTdWZmaXgpIHtcclxuICAgICAgICAgICAgdmFyIGRpZmZlcmVuY2UgPSArdGhpcyxcclxuICAgICAgICAgICAgICAgIG91dHB1dCA9IHJlbGF0aXZlVGltZShkaWZmZXJlbmNlLCAhd2l0aFN1ZmZpeCwgdGhpcy5sYW5nKCkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHdpdGhTdWZmaXgpIHtcclxuICAgICAgICAgICAgICAgIG91dHB1dCA9IHRoaXMubGFuZygpLnBhc3RGdXR1cmUoZGlmZmVyZW5jZSwgb3V0cHV0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLnBvc3Rmb3JtYXQob3V0cHV0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZGQgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xyXG4gICAgICAgICAgICAvLyBzdXBwb3J0cyBvbmx5IDIuMC1zdHlsZSBhZGQoMSwgJ3MnKSBvciBhZGQobW9tZW50KVxyXG4gICAgICAgICAgICB2YXIgZHVyID0gbW9tZW50LmR1cmF0aW9uKGlucHV0LCB2YWwpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzICs9IGR1ci5fbWlsbGlzZWNvbmRzO1xyXG4gICAgICAgICAgICB0aGlzLl9kYXlzICs9IGR1ci5fZGF5cztcclxuICAgICAgICAgICAgdGhpcy5fbW9udGhzICs9IGR1ci5fbW9udGhzO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYnViYmxlKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzdWJ0cmFjdCA6IGZ1bmN0aW9uIChpbnB1dCwgdmFsKSB7XHJcbiAgICAgICAgICAgIHZhciBkdXIgPSBtb21lbnQuZHVyYXRpb24oaW5wdXQsIHZhbCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9taWxsaXNlY29uZHMgLT0gZHVyLl9taWxsaXNlY29uZHM7XHJcbiAgICAgICAgICAgIHRoaXMuX2RheXMgLT0gZHVyLl9kYXlzO1xyXG4gICAgICAgICAgICB0aGlzLl9tb250aHMgLT0gZHVyLl9tb250aHM7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9idWJibGUoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGdldCA6IGZ1bmN0aW9uICh1bml0cykge1xyXG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHMudG9Mb3dlckNhc2UoKSArICdzJ10oKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhcyA6IGZ1bmN0aW9uICh1bml0cykge1xyXG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ2FzJyArIHVuaXRzLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdW5pdHMuc2xpY2UoMSkgKyAncyddKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbGFuZyA6IG1vbWVudC5mbi5sYW5nLFxyXG5cclxuICAgICAgICB0b0lzb1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gaW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL2RvcmRpbGxlL21vbWVudC1pc29kdXJhdGlvbi9ibG9iL21hc3Rlci9tb21lbnQuaXNvZHVyYXRpb24uanNcclxuICAgICAgICAgICAgdmFyIHllYXJzID0gTWF0aC5hYnModGhpcy55ZWFycygpKSxcclxuICAgICAgICAgICAgICAgIG1vbnRocyA9IE1hdGguYWJzKHRoaXMubW9udGhzKCkpLFxyXG4gICAgICAgICAgICAgICAgZGF5cyA9IE1hdGguYWJzKHRoaXMuZGF5cygpKSxcclxuICAgICAgICAgICAgICAgIGhvdXJzID0gTWF0aC5hYnModGhpcy5ob3VycygpKSxcclxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBNYXRoLmFicyh0aGlzLm1pbnV0ZXMoKSksXHJcbiAgICAgICAgICAgICAgICBzZWNvbmRzID0gTWF0aC5hYnModGhpcy5zZWNvbmRzKCkgKyB0aGlzLm1pbGxpc2Vjb25kcygpIC8gMTAwMCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuYXNTZWNvbmRzKCkpIHtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgdGhlIHNhbWUgYXMgQyMncyAoTm9kYSkgYW5kIHB5dGhvbiAoaXNvZGF0ZSkuLi5cclxuICAgICAgICAgICAgICAgIC8vIGJ1dCBub3Qgb3RoZXIgSlMgKGdvb2cuZGF0ZSlcclxuICAgICAgICAgICAgICAgIHJldHVybiAnUDBEJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuICh0aGlzLmFzU2Vjb25kcygpIDwgMCA/ICctJyA6ICcnKSArXHJcbiAgICAgICAgICAgICAgICAnUCcgK1xyXG4gICAgICAgICAgICAgICAgKHllYXJzID8geWVhcnMgKyAnWScgOiAnJykgK1xyXG4gICAgICAgICAgICAgICAgKG1vbnRocyA/IG1vbnRocyArICdNJyA6ICcnKSArXHJcbiAgICAgICAgICAgICAgICAoZGF5cyA/IGRheXMgKyAnRCcgOiAnJykgK1xyXG4gICAgICAgICAgICAgICAgKChob3VycyB8fCBtaW51dGVzIHx8IHNlY29uZHMpID8gJ1QnIDogJycpICtcclxuICAgICAgICAgICAgICAgIChob3VycyA/IGhvdXJzICsgJ0gnIDogJycpICtcclxuICAgICAgICAgICAgICAgIChtaW51dGVzID8gbWludXRlcyArICdNJyA6ICcnKSArXHJcbiAgICAgICAgICAgICAgICAoc2Vjb25kcyA/IHNlY29uZHMgKyAnUycgOiAnJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZUR1cmF0aW9uR2V0dGVyKG5hbWUpIHtcclxuICAgICAgICBtb21lbnQuZHVyYXRpb24uZm5bbmFtZV0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZUR1cmF0aW9uQXNHZXR0ZXIobmFtZSwgZmFjdG9yKSB7XHJcbiAgICAgICAgbW9tZW50LmR1cmF0aW9uLmZuWydhcycgKyBuYW1lXSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICt0aGlzIC8gZmFjdG9yO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChpIGluIHVuaXRNaWxsaXNlY29uZEZhY3RvcnMpIHtcclxuICAgICAgICBpZiAodW5pdE1pbGxpc2Vjb25kRmFjdG9ycy5oYXNPd25Qcm9wZXJ0eShpKSkge1xyXG4gICAgICAgICAgICBtYWtlRHVyYXRpb25Bc0dldHRlcihpLCB1bml0TWlsbGlzZWNvbmRGYWN0b3JzW2ldKTtcclxuICAgICAgICAgICAgbWFrZUR1cmF0aW9uR2V0dGVyKGkudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1ha2VEdXJhdGlvbkFzR2V0dGVyKCdXZWVrcycsIDYwNDhlNSk7XHJcbiAgICBtb21lbnQuZHVyYXRpb24uZm4uYXNNb250aHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgrdGhpcyAtIHRoaXMueWVhcnMoKSAqIDMxNTM2ZTYpIC8gMjU5MmU2ICsgdGhpcy55ZWFycygpICogMTI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgRGVmYXVsdCBMYW5nXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIC8vIFNldCBkZWZhdWx0IGxhbmd1YWdlLCBvdGhlciBsYW5ndWFnZXMgd2lsbCBpbmhlcml0IGZyb20gRW5nbGlzaC5cclxuICAgIG1vbWVudC5sYW5nKCdlbicsIHtcclxuICAgICAgICBvcmRpbmFsIDogZnVuY3Rpb24gKG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgYiA9IG51bWJlciAlIDEwLFxyXG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gKHRvSW50KG51bWJlciAlIDEwMCAvIDEwKSA9PT0gMSkgPyAndGgnIDpcclxuICAgICAgICAgICAgICAgIChiID09PSAxKSA/ICdzdCcgOlxyXG4gICAgICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XHJcbiAgICAgICAgICAgICAgICAoYiA9PT0gMykgPyAncmQnIDogJ3RoJztcclxuICAgICAgICAgICAgcmV0dXJuIG51bWJlciArIG91dHB1dDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKiBFTUJFRF9MQU5HVUFHRVMgKi9cclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgRXhwb3NpbmcgTW9tZW50XHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZUdsb2JhbChzaG91bGREZXByZWNhdGUpIHtcclxuICAgICAgICAvKmdsb2JhbCBlbmRlcjpmYWxzZSAqL1xyXG4gICAgICAgIGlmICh0eXBlb2YgZW5kZXIgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgb2xkR2xvYmFsTW9tZW50ID0gZ2xvYmFsU2NvcGUubW9tZW50O1xyXG4gICAgICAgIGlmIChzaG91bGREZXByZWNhdGUpIHtcclxuICAgICAgICAgICAgZ2xvYmFsU2NvcGUubW9tZW50ID0gZGVwcmVjYXRlKFxyXG4gICAgICAgICAgICAgICAgICAgIFwiQWNjZXNzaW5nIE1vbWVudCB0aHJvdWdoIHRoZSBnbG9iYWwgc2NvcGUgaXMgXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIFwiZGVwcmVjYXRlZCwgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiBhbiB1cGNvbWluZyBcIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWxlYXNlLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vbWVudCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZ2xvYmFsU2NvcGUubW9tZW50ID0gbW9tZW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDb21tb25KUyBtb2R1bGUgaXMgZGVmaW5lZFxyXG4gICAgaWYgKGhhc01vZHVsZSkge1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbW9tZW50O1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShcIm1vbWVudFwiLCBmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XHJcbiAgICAgICAgICAgIGlmIChtb2R1bGUuY29uZmlnICYmIG1vZHVsZS5jb25maWcoKSAmJiBtb2R1bGUuY29uZmlnKCkubm9HbG9iYWwgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlbGVhc2UgdGhlIGdsb2JhbCB2YXJpYWJsZVxyXG4gICAgICAgICAgICAgICAgZ2xvYmFsU2NvcGUubW9tZW50ID0gb2xkR2xvYmFsTW9tZW50O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG1ha2VHbG9iYWwodHJ1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1ha2VHbG9iYWwoKTtcclxuICAgIH1cclxufSkuY2FsbCh0aGlzKTtcclxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuMlxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgdmFyIGRlcHJlY2F0ZSwgaGFzTW9kdWxlLCBtYWtlVHdpeCxcclxuICAgIF9fc2xpY2UgPSBbXS5zbGljZTtcclxuXHJcbiAgaGFzTW9kdWxlID0gKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlICE9PSBudWxsKSAmJiAobW9kdWxlLmV4cG9ydHMgIT0gbnVsbCk7XHJcblxyXG4gIGRlcHJlY2F0ZSA9IGZ1bmN0aW9uKG5hbWUsIGluc3RlYWQsIGZuKSB7XHJcbiAgICB2YXIgYWxyZWFkeURvbmU7XHJcblxyXG4gICAgYWxyZWFkeURvbmUgPSBmYWxzZTtcclxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGFyZ3M7XHJcblxyXG4gICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcclxuICAgICAgaWYgKCFhbHJlYWR5RG9uZSkge1xyXG4gICAgICAgIGlmICgodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZSAhPT0gbnVsbCkgJiYgKGNvbnNvbGUud2FybiAhPSBudWxsKSkge1xyXG4gICAgICAgICAgY29uc29sZS53YXJuKFwiI1wiICsgbmFtZSArIFwiIGlzIGRlcHJlY2F0ZWQuIFVzZSAjXCIgKyBpbnN0ZWFkICsgXCIgaW5zdGVhZC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGFscmVhZHlEb25lID0gdHJ1ZTtcclxuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBtYWtlVHdpeCA9IGZ1bmN0aW9uKG1vbWVudCkge1xyXG4gICAgdmFyIFR3aXgsIGdldFByb3RvdHlwZU9mLCBsYW5ndWFnZXNMb2FkZWQ7XHJcblxyXG4gICAgaWYgKG1vbWVudCA9PSBudWxsKSB7XHJcbiAgICAgIHRocm93IFwiQ2FuJ3QgZmluZCBtb21lbnRcIjtcclxuICAgIH1cclxuICAgIGxhbmd1YWdlc0xvYWRlZCA9IGZhbHNlO1xyXG4gICAgVHdpeCA9IChmdW5jdGlvbigpIHtcclxuICAgICAgZnVuY3Rpb24gVHdpeChzdGFydCwgZW5kLCBwYXJzZUZvcm1hdCwgb3B0aW9ucykge1xyXG4gICAgICAgIHZhciBfcmVmO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XHJcbiAgICAgICAgICBvcHRpb25zID0ge307XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgcGFyc2VGb3JtYXQgIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgIG9wdGlvbnMgPSBwYXJzZUZvcm1hdCAhPSBudWxsID8gcGFyc2VGb3JtYXQgOiB7fTtcclxuICAgICAgICAgIHBhcnNlRm9ybWF0ID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcImJvb2xlYW5cIikge1xyXG4gICAgICAgICAgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgYWxsRGF5OiBvcHRpb25zXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0YXJ0ID0gbW9tZW50KHN0YXJ0LCBwYXJzZUZvcm1hdCwgb3B0aW9ucy5wYXJzZVN0cmljdCk7XHJcbiAgICAgICAgdGhpcy5lbmQgPSBtb21lbnQoZW5kLCBwYXJzZUZvcm1hdCwgb3B0aW9ucy5wYXJzZVN0cmljdCk7XHJcbiAgICAgICAgdGhpcy5hbGxEYXkgPSAoX3JlZiA9IG9wdGlvbnMuYWxsRGF5KSAhPSBudWxsID8gX3JlZiA6IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBUd2l4Ll9leHRlbmQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgYXR0ciwgZmlyc3QsIG90aGVyLCBvdGhlcnMsIF9pLCBfbGVuO1xyXG5cclxuICAgICAgICBmaXJzdCA9IGFyZ3VtZW50c1swXSwgb3RoZXJzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcclxuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG90aGVycy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xyXG4gICAgICAgICAgb3RoZXIgPSBvdGhlcnNbX2ldO1xyXG4gICAgICAgICAgZm9yIChhdHRyIGluIG90aGVyKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3RoZXJbYXR0cl0gIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICBmaXJzdFthdHRyXSA9IG90aGVyW2F0dHJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmaXJzdDtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXguZGVmYXVsdHMgPSB7XHJcbiAgICAgICAgdHdlbnR5Rm91ckhvdXI6IGZhbHNlLFxyXG4gICAgICAgIGFsbERheVNpbXBsZToge1xyXG4gICAgICAgICAgZm46IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmFsbERheTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbG90OiAwLFxyXG4gICAgICAgICAgcHJlOiBcIiBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGF5T2ZXZWVrOiB7XHJcbiAgICAgICAgICBmbjogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkYXRlLmZvcm1hdChvcHRpb25zLndlZWtkYXlGb3JtYXQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNsb3Q6IDEsXHJcbiAgICAgICAgICBwcmU6IFwiIFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhbGxEYXlNb250aDoge1xyXG4gICAgICAgICAgZm46IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGF0ZS5mb3JtYXQoXCJcIiArIG9wdGlvbnMubW9udGhGb3JtYXQgKyBcIiBcIiArIG9wdGlvbnMuZGF5Rm9ybWF0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbG90OiAyLFxyXG4gICAgICAgICAgcHJlOiBcIiBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbW9udGg6IHtcclxuICAgICAgICAgIGZuOiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRhdGUuZm9ybWF0KG9wdGlvbnMubW9udGhGb3JtYXQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNsb3Q6IDIsXHJcbiAgICAgICAgICBwcmU6IFwiIFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkYXRlOiB7XHJcbiAgICAgICAgICBmbjogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkYXRlLmZvcm1hdChvcHRpb25zLmRheUZvcm1hdCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2xvdDogMyxcclxuICAgICAgICAgIHByZTogXCIgXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHllYXI6IHtcclxuICAgICAgICAgIGZuOiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRhdGUuZm9ybWF0KG9wdGlvbnMueWVhckZvcm1hdCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2xvdDogNCxcclxuICAgICAgICAgIHByZTogXCIsIFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0aW1lOiB7XHJcbiAgICAgICAgICBmbjogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgICAgICAgIHZhciBzdHI7XHJcblxyXG4gICAgICAgICAgICAgIHN0ciA9IGRhdGUubWludXRlcygpID09PSAwICYmIG9wdGlvbnMuaW1wbGljaXRNaW51dGVzICYmICFvcHRpb25zLnR3ZW50eUZvdXJIb3VyID8gZGF0ZS5mb3JtYXQob3B0aW9ucy5ob3VyRm9ybWF0KSA6IGRhdGUuZm9ybWF0KFwiXCIgKyBvcHRpb25zLmhvdXJGb3JtYXQgKyBcIjpcIiArIG9wdGlvbnMubWludXRlRm9ybWF0KTtcclxuICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuZ3JvdXBNZXJpZGllbXMgJiYgIW9wdGlvbnMudHdlbnR5Rm91ckhvdXIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnNwYWNlQmVmb3JlTWVyaWRpZW0pIHtcclxuICAgICAgICAgICAgICAgICAgc3RyICs9IFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3RyICs9IGRhdGUuZm9ybWF0KG9wdGlvbnMubWVyaWRpZW1Gb3JtYXQpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNsb3Q6IDUsXHJcbiAgICAgICAgICBwcmU6IFwiLCBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbWVyaWRpZW06IHtcclxuICAgICAgICAgIGZuOiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiB0LmZvcm1hdChvcHRpb25zLm1lcmlkaWVtRm9ybWF0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbG90OiA2LFxyXG4gICAgICAgICAgcHJlOiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNwYWNlQmVmb3JlTWVyaWRpZW0pIHtcclxuICAgICAgICAgICAgICByZXR1cm4gXCIgXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnJlZ2lzdGVyTGFuZyA9IGZ1bmN0aW9uKG5hbWUsIG9wdGlvbnMpIHtcclxuICAgICAgICByZXR1cm4gbW9tZW50LmxhbmcobmFtZSwge1xyXG4gICAgICAgICAgdHdpeDogVHdpeC5fZXh0ZW5kKHt9LCBUd2l4LmRlZmF1bHRzLCBvcHRpb25zKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuaXNTYW1lID0gZnVuY3Rpb24ocGVyaW9kKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnQuaXNTYW1lKHRoaXMuZW5kLCBwZXJpb2QpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24ocGVyaW9kKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RydWVFbmQodHJ1ZSkuZGlmZih0aGlzLl90cnVlU3RhcnQoKSwgcGVyaW9kKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmNvdW50ID0gZnVuY3Rpb24ocGVyaW9kKSB7XHJcbiAgICAgICAgdmFyIGVuZCwgc3RhcnQ7XHJcblxyXG4gICAgICAgIHN0YXJ0ID0gdGhpcy5zdGFydC5jbG9uZSgpLnN0YXJ0T2YocGVyaW9kKTtcclxuICAgICAgICBlbmQgPSB0aGlzLmVuZC5jbG9uZSgpLnN0YXJ0T2YocGVyaW9kKTtcclxuICAgICAgICByZXR1cm4gZW5kLmRpZmYoc3RhcnQsIHBlcmlvZCkgKyAxO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuY291bnRJbm5lciA9IGZ1bmN0aW9uKHBlcmlvZCkge1xyXG4gICAgICAgIHZhciBlbmQsIHN0YXJ0LCBfcmVmO1xyXG5cclxuICAgICAgICBfcmVmID0gdGhpcy5faW5uZXIocGVyaW9kKSwgc3RhcnQgPSBfcmVmWzBdLCBlbmQgPSBfcmVmWzFdO1xyXG4gICAgICAgIGlmIChzdGFydCA+PSBlbmQpIHtcclxuICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZW5kLmRpZmYoc3RhcnQsIHBlcmlvZCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5pdGVyYXRlID0gZnVuY3Rpb24oaW50ZXJ2YWxBbW91bnQsIHBlcmlvZCwgbWluSG91cnMpIHtcclxuICAgICAgICB2YXIgZW5kLCBoYXNOZXh0LCBzdGFydCwgX3JlZixcclxuICAgICAgICAgIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGludGVydmFsQW1vdW50ID09IG51bGwpIHtcclxuICAgICAgICAgIGludGVydmFsQW1vdW50ID0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgX3JlZiA9IHRoaXMuX3ByZXBJdGVyYXRlSW5wdXRzKGludGVydmFsQW1vdW50LCBwZXJpb2QsIG1pbkhvdXJzKSwgaW50ZXJ2YWxBbW91bnQgPSBfcmVmWzBdLCBwZXJpb2QgPSBfcmVmWzFdLCBtaW5Ib3VycyA9IF9yZWZbMl07XHJcbiAgICAgICAgc3RhcnQgPSB0aGlzLnN0YXJ0LmNsb25lKCkuc3RhcnRPZihwZXJpb2QpO1xyXG4gICAgICAgIGVuZCA9IHRoaXMuZW5kLmNsb25lKCkuc3RhcnRPZihwZXJpb2QpO1xyXG4gICAgICAgIGhhc05leHQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiBzdGFydCA8PSBlbmQgJiYgKCFtaW5Ib3VycyB8fCBzdGFydC52YWx1ZU9mKCkgIT09IGVuZC52YWx1ZU9mKCkgfHwgX3RoaXMuZW5kLmhvdXJzKCkgPiBtaW5Ib3VycyB8fCBfdGhpcy5hbGxEYXkpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2l0ZXJhdGVIZWxwZXIocGVyaW9kLCBzdGFydCwgaGFzTmV4dCwgaW50ZXJ2YWxBbW91bnQpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuaXRlcmF0ZUlubmVyID0gZnVuY3Rpb24oaW50ZXJ2YWxBbW91bnQsIHBlcmlvZCkge1xyXG4gICAgICAgIHZhciBlbmQsIGhhc05leHQsIHN0YXJ0LCBfcmVmLCBfcmVmMTtcclxuXHJcbiAgICAgICAgaWYgKGludGVydmFsQW1vdW50ID09IG51bGwpIHtcclxuICAgICAgICAgIGludGVydmFsQW1vdW50ID0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgX3JlZiA9IHRoaXMuX3ByZXBJdGVyYXRlSW5wdXRzKGludGVydmFsQW1vdW50LCBwZXJpb2QpLCBpbnRlcnZhbEFtb3VudCA9IF9yZWZbMF0sIHBlcmlvZCA9IF9yZWZbMV07XHJcbiAgICAgICAgX3JlZjEgPSB0aGlzLl9pbm5lcihwZXJpb2QsIGludGVydmFsQW1vdW50KSwgc3RhcnQgPSBfcmVmMVswXSwgZW5kID0gX3JlZjFbMV07XHJcbiAgICAgICAgaGFzTmV4dCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHN0YXJ0IDwgZW5kO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2l0ZXJhdGVIZWxwZXIocGVyaW9kLCBzdGFydCwgaGFzTmV4dCwgaW50ZXJ2YWxBbW91bnQpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuaHVtYW5pemVMZW5ndGggPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5hbGxEYXkpIHtcclxuICAgICAgICAgIGlmICh0aGlzLmlzU2FtZShcImRheVwiKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJhbGwgZGF5XCI7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGFydC5mcm9tKHRoaXMuZW5kLmNsb25lKCkuYWRkKDEsIFwiZGF5XCIpLCB0cnVlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnQuZnJvbSh0aGlzLmVuZCwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuYXNEdXJhdGlvbiA9IGZ1bmN0aW9uKHVuaXRzKSB7XHJcbiAgICAgICAgdmFyIGRpZmY7XHJcblxyXG4gICAgICAgIGRpZmYgPSB0aGlzLmVuZC5kaWZmKHRoaXMuc3RhcnQpO1xyXG4gICAgICAgIHJldHVybiBtb21lbnQuZHVyYXRpb24oZGlmZik7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5pc1Bhc3QgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5hbGxEYXkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmVuZC5jbG9uZSgpLmVuZE9mKFwiZGF5XCIpIDwgbW9tZW50KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmVuZCA8IG1vbWVudCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmlzRnV0dXJlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRGF5KSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5zdGFydC5jbG9uZSgpLnN0YXJ0T2YoXCJkYXlcIikgPiBtb21lbnQoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnQgPiBtb21lbnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5pc0N1cnJlbnQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gIXRoaXMuaXNQYXN0KCkgJiYgIXRoaXMuaXNGdXR1cmUoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24obW9tKSB7XHJcbiAgICAgICAgbW9tID0gbW9tZW50KG1vbSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RydWVTdGFydCgpIDw9IG1vbSAmJiB0aGlzLl90cnVlRW5kKCkgPj0gbW9tO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90cnVlU3RhcnQoKS52YWx1ZU9mKCkgPT09IHRoaXMuX3RydWVFbmQoKS52YWx1ZU9mKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5vdmVybGFwcyA9IGZ1bmN0aW9uKG90aGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RydWVFbmQoKS5pc0FmdGVyKG90aGVyLl90cnVlU3RhcnQoKSkgJiYgdGhpcy5fdHJ1ZVN0YXJ0KCkuaXNCZWZvcmUob3RoZXIuX3RydWVFbmQoKSk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5lbmd1bGZzID0gZnVuY3Rpb24ob3RoZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdHJ1ZVN0YXJ0KCkgPD0gb3RoZXIuX3RydWVTdGFydCgpICYmIHRoaXMuX3RydWVFbmQoKSA+PSBvdGhlci5fdHJ1ZUVuZCgpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUudW5pb24gPSBmdW5jdGlvbihvdGhlcikge1xyXG4gICAgICAgIHZhciBhbGxEYXksIG5ld0VuZCwgbmV3U3RhcnQ7XHJcblxyXG4gICAgICAgIGFsbERheSA9IHRoaXMuYWxsRGF5ICYmIG90aGVyLmFsbERheTtcclxuICAgICAgICBpZiAoYWxsRGF5KSB7XHJcbiAgICAgICAgICBuZXdTdGFydCA9IHRoaXMuc3RhcnQgPCBvdGhlci5zdGFydCA/IHRoaXMuc3RhcnQgOiBvdGhlci5zdGFydDtcclxuICAgICAgICAgIG5ld0VuZCA9IHRoaXMuZW5kID4gb3RoZXIuZW5kID8gdGhpcy5lbmQgOiBvdGhlci5lbmQ7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG5ld1N0YXJ0ID0gdGhpcy5fdHJ1ZVN0YXJ0KCkgPCBvdGhlci5fdHJ1ZVN0YXJ0KCkgPyB0aGlzLl90cnVlU3RhcnQoKSA6IG90aGVyLl90cnVlU3RhcnQoKTtcclxuICAgICAgICAgIG5ld0VuZCA9IHRoaXMuX3RydWVFbmQoKSA+IG90aGVyLl90cnVlRW5kKCkgPyB0aGlzLl90cnVlRW5kKCkgOiBvdGhlci5fdHJ1ZUVuZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IFR3aXgobmV3U3RhcnQsIG5ld0VuZCwgYWxsRGF5KTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKG90aGVyKSB7XHJcbiAgICAgICAgdmFyIGFsbERheSwgZW5kLCBuZXdFbmQsIG5ld1N0YXJ0O1xyXG5cclxuICAgICAgICBuZXdTdGFydCA9IHRoaXMuc3RhcnQgPiBvdGhlci5zdGFydCA/IHRoaXMuc3RhcnQgOiBvdGhlci5zdGFydDtcclxuICAgICAgICBpZiAodGhpcy5hbGxEYXkpIHtcclxuICAgICAgICAgIGVuZCA9IG1vbWVudCh0aGlzLmVuZCk7XHJcbiAgICAgICAgICBlbmQuYWRkKDEsIFwiZGF5XCIpO1xyXG4gICAgICAgICAgZW5kLnN1YnRyYWN0KDEsIFwibWlsbGlzZWNvbmRcIik7XHJcbiAgICAgICAgICBpZiAob3RoZXIuYWxsRGF5KSB7XHJcbiAgICAgICAgICAgIG5ld0VuZCA9IGVuZCA8IG90aGVyLmVuZCA/IHRoaXMuZW5kIDogb3RoZXIuZW5kO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbmV3RW5kID0gZW5kIDwgb3RoZXIuZW5kID8gZW5kIDogb3RoZXIuZW5kO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBuZXdFbmQgPSB0aGlzLmVuZCA8IG90aGVyLmVuZCA/IHRoaXMuZW5kIDogb3RoZXIuZW5kO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhbGxEYXkgPSB0aGlzLmFsbERheSAmJiBvdGhlci5hbGxEYXk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBUd2l4KG5ld1N0YXJ0LCBuZXdFbmQsIGFsbERheSk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5pc1ZhbGlkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RydWVTdGFydCgpIDw9IHRoaXMuX3RydWVFbmQoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uKG90aGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIChvdGhlciBpbnN0YW5jZW9mIFR3aXgpICYmIHRoaXMuYWxsRGF5ID09PSBvdGhlci5hbGxEYXkgJiYgdGhpcy5zdGFydC52YWx1ZU9mKCkgPT09IG90aGVyLnN0YXJ0LnZhbHVlT2YoKSAmJiB0aGlzLmVuZC52YWx1ZU9mKCkgPT09IG90aGVyLmVuZC52YWx1ZU9mKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBfcmVmO1xyXG5cclxuICAgICAgICByZXR1cm4gXCJ7c3RhcnQ6IFwiICsgKHRoaXMuc3RhcnQuZm9ybWF0KCkpICsgXCIsIGVuZDogXCIgKyAodGhpcy5lbmQuZm9ybWF0KCkpICsgXCIsIGFsbERheTogXCIgKyAoKF9yZWYgPSB0aGlzLmFsbERheSkgIT0gbnVsbCA/IF9yZWYgOiB7XHJcbiAgICAgICAgICBcInRydWVcIjogXCJmYWxzZVwiXHJcbiAgICAgICAgfSkgKyBcIn1cIjtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLnNpbXBsZUZvcm1hdCA9IGZ1bmN0aW9uKG1vbWVudE9wdHMsIGlub3B0cykge1xyXG4gICAgICAgIHZhciBvcHRpb25zLCBzO1xyXG5cclxuICAgICAgICBvcHRpb25zID0ge1xyXG4gICAgICAgICAgYWxsRGF5OiBcIihhbGwgZGF5KVwiLFxyXG4gICAgICAgICAgdGVtcGxhdGU6IFR3aXguZm9ybWF0VGVtcGxhdGVcclxuICAgICAgICB9O1xyXG4gICAgICAgIFR3aXguX2V4dGVuZChvcHRpb25zLCBpbm9wdHMgfHwge30pO1xyXG4gICAgICAgIHMgPSBvcHRpb25zLnRlbXBsYXRlKHRoaXMuc3RhcnQuZm9ybWF0KG1vbWVudE9wdHMpLCB0aGlzLmVuZC5mb3JtYXQobW9tZW50T3B0cykpO1xyXG4gICAgICAgIGlmICh0aGlzLmFsbERheSAmJiBvcHRpb25zLmFsbERheSkge1xyXG4gICAgICAgICAgcyArPSBcIiBcIiArIG9wdGlvbnMuYWxsRGF5O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcztcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uKGlub3B0cykge1xyXG4gICAgICAgIHZhciBjb21tb25fYnVja2V0LCBlbmRfYnVja2V0LCBmb2xkLCBmb3JtYXQsIGZzLCBnbG9iYWxfZmlyc3QsIGdvZXNJbnRvVGhlTW9ybmluZywgbmVlZERhdGUsIG9wdGlvbnMsIHByb2Nlc3MsIHN0YXJ0X2J1Y2tldCwgdG9nZXRoZXIsIF9pLCBfbGVuLFxyXG4gICAgICAgICAgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLl9sYXp5TGFuZygpO1xyXG4gICAgICAgIGlmICh0aGlzLmlzRW1wdHkoKSkge1xyXG4gICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICBncm91cE1lcmlkaWVtczogdHJ1ZSxcclxuICAgICAgICAgIHNwYWNlQmVmb3JlTWVyaWRpZW06IHRydWUsXHJcbiAgICAgICAgICBzaG93RGF0ZTogdHJ1ZSxcclxuICAgICAgICAgIHNob3dEYXlPZldlZWs6IGZhbHNlLFxyXG4gICAgICAgICAgdHdlbnR5Rm91ckhvdXI6IHRoaXMubGFuZ0RhdGEudHdlbnR5Rm91ckhvdXIsXHJcbiAgICAgICAgICBpbXBsaWNpdE1pbnV0ZXM6IHRydWUsXHJcbiAgICAgICAgICBpbXBsaWNpdFllYXI6IHRydWUsXHJcbiAgICAgICAgICB5ZWFyRm9ybWF0OiBcIllZWVlcIixcclxuICAgICAgICAgIG1vbnRoRm9ybWF0OiBcIk1NTVwiLFxyXG4gICAgICAgICAgd2Vla2RheUZvcm1hdDogXCJkZGRcIixcclxuICAgICAgICAgIGRheUZvcm1hdDogXCJEXCIsXHJcbiAgICAgICAgICBtZXJpZGllbUZvcm1hdDogXCJBXCIsXHJcbiAgICAgICAgICBob3VyRm9ybWF0OiBcImhcIixcclxuICAgICAgICAgIG1pbnV0ZUZvcm1hdDogXCJtbVwiLFxyXG4gICAgICAgICAgYWxsRGF5OiBcImFsbCBkYXlcIixcclxuICAgICAgICAgIGV4cGxpY2l0QWxsRGF5OiBmYWxzZSxcclxuICAgICAgICAgIGxhc3ROaWdodEVuZHNBdDogMCxcclxuICAgICAgICAgIHRlbXBsYXRlOiBUd2l4LmZvcm1hdFRlbXBsYXRlXHJcbiAgICAgICAgfTtcclxuICAgICAgICBUd2l4Ll9leHRlbmQob3B0aW9ucywgaW5vcHRzIHx8IHt9KTtcclxuICAgICAgICBmcyA9IFtdO1xyXG4gICAgICAgIGlmIChvcHRpb25zLnR3ZW50eUZvdXJIb3VyKSB7XHJcbiAgICAgICAgICBvcHRpb25zLmhvdXJGb3JtYXQgPSBvcHRpb25zLmhvdXJGb3JtYXQucmVwbGFjZShcImhcIiwgXCJIXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnb2VzSW50b1RoZU1vcm5pbmcgPSBvcHRpb25zLmxhc3ROaWdodEVuZHNBdCA+IDAgJiYgIXRoaXMuYWxsRGF5ICYmIHRoaXMuZW5kLmNsb25lKCkuc3RhcnRPZihcImRheVwiKS52YWx1ZU9mKCkgPT09IHRoaXMuc3RhcnQuY2xvbmUoKS5hZGQoMSwgXCJkYXlcIikuc3RhcnRPZihcImRheVwiKS52YWx1ZU9mKCkgJiYgdGhpcy5zdGFydC5ob3VycygpID4gMTIgJiYgdGhpcy5lbmQuaG91cnMoKSA8IG9wdGlvbnMubGFzdE5pZ2h0RW5kc0F0O1xyXG4gICAgICAgIG5lZWREYXRlID0gb3B0aW9ucy5zaG93RGF0ZSB8fCAoIXRoaXMuaXNTYW1lKFwiZGF5XCIpICYmICFnb2VzSW50b1RoZU1vcm5pbmcpO1xyXG4gICAgICAgIGlmICh0aGlzLmFsbERheSAmJiB0aGlzLmlzU2FtZShcImRheVwiKSAmJiAoIW9wdGlvbnMuc2hvd0RhdGUgfHwgb3B0aW9ucy5leHBsaWNpdEFsbERheSkpIHtcclxuICAgICAgICAgIGZzLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBcImFsbCBkYXkgc2ltcGxlXCIsXHJcbiAgICAgICAgICAgIGZuOiB0aGlzLl9mb3JtYXRGbignYWxsRGF5U2ltcGxlJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHByZTogdGhpcy5fZm9ybWF0UHJlKCdhbGxEYXlTaW1wbGUnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgc2xvdDogdGhpcy5fZm9ybWF0U2xvdCgnYWxsRGF5U2ltcGxlJylcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobmVlZERhdGUgJiYgKCFvcHRpb25zLmltcGxpY2l0WWVhciB8fCB0aGlzLnN0YXJ0LnllYXIoKSAhPT0gbW9tZW50KCkueWVhcigpIHx8ICF0aGlzLmlzU2FtZShcInllYXJcIikpKSB7XHJcbiAgICAgICAgICBmcy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogXCJ5ZWFyXCIsXHJcbiAgICAgICAgICAgIGZuOiB0aGlzLl9mb3JtYXRGbigneWVhcicsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBwcmU6IHRoaXMuX2Zvcm1hdFByZSgneWVhcicsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBzbG90OiB0aGlzLl9mb3JtYXRTbG90KCd5ZWFyJylcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRoaXMuYWxsRGF5ICYmIG5lZWREYXRlKSB7XHJcbiAgICAgICAgICBmcy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogXCJhbGwgZGF5IG1vbnRoXCIsXHJcbiAgICAgICAgICAgIGZuOiB0aGlzLl9mb3JtYXRGbignYWxsRGF5TW9udGgnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgaWdub3JlRW5kOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZ29lc0ludG9UaGVNb3JuaW5nO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwcmU6IHRoaXMuX2Zvcm1hdFByZSgnYWxsRGF5TW9udGgnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgc2xvdDogdGhpcy5fZm9ybWF0U2xvdCgnYWxsRGF5TW9udGgnKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmFsbERheSAmJiBuZWVkRGF0ZSkge1xyXG4gICAgICAgICAgZnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IFwibW9udGhcIixcclxuICAgICAgICAgICAgZm46IHRoaXMuX2Zvcm1hdEZuKCdtb250aCcsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBwcmU6IHRoaXMuX2Zvcm1hdFByZSgnbW9udGgnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgc2xvdDogdGhpcy5fZm9ybWF0U2xvdCgnbW9udGgnKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmFsbERheSAmJiBuZWVkRGF0ZSkge1xyXG4gICAgICAgICAgZnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiZGF0ZVwiLFxyXG4gICAgICAgICAgICBmbjogdGhpcy5fZm9ybWF0Rm4oJ2RhdGUnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgcHJlOiB0aGlzLl9mb3JtYXRQcmUoJ2RhdGUnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgc2xvdDogdGhpcy5fZm9ybWF0U2xvdCgnZGF0ZScpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG5lZWREYXRlICYmIG9wdGlvbnMuc2hvd0RheU9mV2Vlaykge1xyXG4gICAgICAgICAgZnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiZGF5IG9mIHdlZWtcIixcclxuICAgICAgICAgICAgZm46IHRoaXMuX2Zvcm1hdEZuKCdkYXlPZldlZWsnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgcHJlOiB0aGlzLl9mb3JtYXRQcmUoJ2RheU9mV2VlaycsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBzbG90OiB0aGlzLl9mb3JtYXRTbG90KCdkYXlPZldlZWsnKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmdyb3VwTWVyaWRpZW1zICYmICFvcHRpb25zLnR3ZW50eUZvdXJIb3VyICYmICF0aGlzLmFsbERheSkge1xyXG4gICAgICAgICAgZnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IFwibWVyaWRpZW1cIixcclxuICAgICAgICAgICAgZm46IHRoaXMuX2Zvcm1hdEZuKCdtZXJpZGllbScsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBwcmU6IHRoaXMuX2Zvcm1hdFByZSgnbWVyaWRpZW0nLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgc2xvdDogdGhpcy5fZm9ybWF0U2xvdCgnbWVyaWRpZW0nKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5hbGxEYXkpIHtcclxuICAgICAgICAgIGZzLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBcInRpbWVcIixcclxuICAgICAgICAgICAgZm46IHRoaXMuX2Zvcm1hdEZuKCd0aW1lJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHByZTogdGhpcy5fZm9ybWF0UHJlKCd0aW1lJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHNsb3Q6IHRoaXMuX2Zvcm1hdFNsb3QoJ3RpbWUnKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0YXJ0X2J1Y2tldCA9IFtdO1xyXG4gICAgICAgIGVuZF9idWNrZXQgPSBbXTtcclxuICAgICAgICBjb21tb25fYnVja2V0ID0gW107XHJcbiAgICAgICAgdG9nZXRoZXIgPSB0cnVlO1xyXG4gICAgICAgIHByb2Nlc3MgPSBmdW5jdGlvbihmb3JtYXQpIHtcclxuICAgICAgICAgIHZhciBlbmRfc3RyLCBzdGFydF9ncm91cCwgc3RhcnRfc3RyO1xyXG5cclxuICAgICAgICAgIHN0YXJ0X3N0ciA9IGZvcm1hdC5mbihfdGhpcy5zdGFydCk7XHJcbiAgICAgICAgICBlbmRfc3RyID0gZm9ybWF0Lmlnbm9yZUVuZCAmJiBmb3JtYXQuaWdub3JlRW5kKCkgPyBzdGFydF9zdHIgOiBmb3JtYXQuZm4oX3RoaXMuZW5kKTtcclxuICAgICAgICAgIHN0YXJ0X2dyb3VwID0ge1xyXG4gICAgICAgICAgICBmb3JtYXQ6IGZvcm1hdCxcclxuICAgICAgICAgICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBzdGFydF9zdHI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBpZiAoZW5kX3N0ciA9PT0gc3RhcnRfc3RyICYmIHRvZ2V0aGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb21tb25fYnVja2V0LnB1c2goc3RhcnRfZ3JvdXApO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHRvZ2V0aGVyKSB7XHJcbiAgICAgICAgICAgICAgdG9nZXRoZXIgPSBmYWxzZTtcclxuICAgICAgICAgICAgICBjb21tb25fYnVja2V0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgZm9ybWF0OiB7XHJcbiAgICAgICAgICAgICAgICAgIHNsb3Q6IGZvcm1hdC5zbG90LFxyXG4gICAgICAgICAgICAgICAgICBwcmU6IFwiXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLnRlbXBsYXRlKGZvbGQoc3RhcnRfYnVja2V0KSwgZm9sZChlbmRfYnVja2V0LCB0cnVlKS50cmltKCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0YXJ0X2J1Y2tldC5wdXNoKHN0YXJ0X2dyb3VwKTtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZF9idWNrZXQucHVzaCh7XHJcbiAgICAgICAgICAgICAgZm9ybWF0OiBmb3JtYXQsXHJcbiAgICAgICAgICAgICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZF9zdHI7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gZnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcclxuICAgICAgICAgIGZvcm1hdCA9IGZzW19pXTtcclxuICAgICAgICAgIHByb2Nlc3MoZm9ybWF0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZ2xvYmFsX2ZpcnN0ID0gdHJ1ZTtcclxuICAgICAgICBmb2xkID0gZnVuY3Rpb24oYXJyYXksIHNraXBfcHJlKSB7XHJcbiAgICAgICAgICB2YXIgbG9jYWxfZmlyc3QsIHNlY3Rpb24sIHN0ciwgX2osIF9sZW4xLCBfcmVmO1xyXG5cclxuICAgICAgICAgIGxvY2FsX2ZpcnN0ID0gdHJ1ZTtcclxuICAgICAgICAgIHN0ciA9IFwiXCI7XHJcbiAgICAgICAgICBfcmVmID0gYXJyYXkuc29ydChmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhLmZvcm1hdC5zbG90IC0gYi5mb3JtYXQuc2xvdDtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcclxuICAgICAgICAgICAgc2VjdGlvbiA9IF9yZWZbX2pdO1xyXG4gICAgICAgICAgICBpZiAoIWdsb2JhbF9maXJzdCkge1xyXG4gICAgICAgICAgICAgIGlmIChsb2NhbF9maXJzdCAmJiBza2lwX3ByZSkge1xyXG4gICAgICAgICAgICAgICAgc3RyICs9IFwiIFwiO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdHIgKz0gc2VjdGlvbi5mb3JtYXQucHJlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdHIgKz0gc2VjdGlvbi52YWx1ZSgpO1xyXG4gICAgICAgICAgICBnbG9iYWxfZmlyc3QgPSBmYWxzZTtcclxuICAgICAgICAgICAgbG9jYWxfZmlyc3QgPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gZm9sZChjb21tb25fYnVja2V0KTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLl90cnVlU3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5hbGxEYXkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0LmNsb25lKCkuc3RhcnRPZihcImRheVwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnQuY2xvbmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5fdHJ1ZUVuZCA9IGZ1bmN0aW9uKGRpZmZhYmxlRW5kKSB7XHJcbiAgICAgICAgaWYgKGRpZmZhYmxlRW5kID09IG51bGwpIHtcclxuICAgICAgICAgIGRpZmZhYmxlRW5kID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmFsbERheSkge1xyXG4gICAgICAgICAgaWYgKGRpZmZhYmxlRW5kKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVuZC5jbG9uZSgpLmFkZCgxLCBcImRheVwiKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVuZC5jbG9uZSgpLmVuZE9mKFwiZGF5XCIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5lbmQuY2xvbmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5faXRlcmF0ZUhlbHBlciA9IGZ1bmN0aW9uKHBlcmlvZCwgaXRlciwgaGFzTmV4dCwgaW50ZXJ2YWxBbW91bnQpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoaW50ZXJ2YWxBbW91bnQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgaW50ZXJ2YWxBbW91bnQgPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWw7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWhhc05leHQoKSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHZhbCA9IGl0ZXIuY2xvbmUoKTtcclxuICAgICAgICAgICAgICBpdGVyLmFkZChpbnRlcnZhbEFtb3VudCwgcGVyaW9kKTtcclxuICAgICAgICAgICAgICByZXR1cm4gdmFsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgaGFzTmV4dDogaGFzTmV4dFxyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5fcHJlcEl0ZXJhdGVJbnB1dHMgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaW5wdXRzLCBpbnRlcnZhbEFtb3VudCwgbWluSG91cnMsIHBlcmlvZCwgX3JlZiwgX3JlZjE7XHJcblxyXG4gICAgICAgIGlucHV0cyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dHNbMF0gPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICByZXR1cm4gaW5wdXRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIGlucHV0c1swXSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgIHBlcmlvZCA9IGlucHV0cy5zaGlmdCgpO1xyXG4gICAgICAgICAgaW50ZXJ2YWxBbW91bnQgPSAoX3JlZiA9IGlucHV0cy5wb3AoKSkgIT0gbnVsbCA/IF9yZWYgOiAxO1xyXG4gICAgICAgICAgaWYgKGlucHV0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbWluSG91cnMgPSAoX3JlZjEgPSBpbnB1dHNbMF0pICE9IG51bGwgPyBfcmVmMSA6IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobW9tZW50LmlzRHVyYXRpb24oaW5wdXRzWzBdKSkge1xyXG4gICAgICAgICAgcGVyaW9kID0gJ21pbGxpc2Vjb25kcyc7XHJcbiAgICAgICAgICBpbnRlcnZhbEFtb3VudCA9IGlucHV0c1swXS5hcyhwZXJpb2QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW2ludGVydmFsQW1vdW50LCBwZXJpb2QsIG1pbkhvdXJzXTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLl9pbm5lciA9IGZ1bmN0aW9uKHBlcmlvZCwgaW50ZXJ2YWxBbW91bnQpIHtcclxuICAgICAgICB2YXIgZHVyYXRpb25Db3VudCwgZHVyYXRpb25QZXJpb2QsIGVuZCwgbW9kdWx1cywgc3RhcnQ7XHJcblxyXG4gICAgICAgIGlmIChwZXJpb2QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgcGVyaW9kID0gXCJtaWxsaXNlY29uZHNcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGludGVydmFsQW1vdW50ID09IG51bGwpIHtcclxuICAgICAgICAgIGludGVydmFsQW1vdW50ID0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhcnQgPSB0aGlzLl90cnVlU3RhcnQoKTtcclxuICAgICAgICBlbmQgPSB0aGlzLl90cnVlRW5kKHRydWUpO1xyXG4gICAgICAgIGlmIChzdGFydCA+IHN0YXJ0LmNsb25lKCkuc3RhcnRPZihwZXJpb2QpKSB7XHJcbiAgICAgICAgICBzdGFydC5zdGFydE9mKHBlcmlvZCkuYWRkKGludGVydmFsQW1vdW50LCBwZXJpb2QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZW5kIDwgZW5kLmNsb25lKCkuZW5kT2YocGVyaW9kKSkge1xyXG4gICAgICAgICAgZW5kLnN0YXJ0T2YocGVyaW9kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZHVyYXRpb25QZXJpb2QgPSBzdGFydC50d2l4KGVuZCkuYXNEdXJhdGlvbihwZXJpb2QpO1xyXG4gICAgICAgIGR1cmF0aW9uQ291bnQgPSBkdXJhdGlvblBlcmlvZC5nZXQocGVyaW9kKTtcclxuICAgICAgICBtb2R1bHVzID0gZHVyYXRpb25Db3VudCAlIGludGVydmFsQW1vdW50O1xyXG4gICAgICAgIGVuZC5zdWJ0cmFjdChtb2R1bHVzLCBwZXJpb2QpO1xyXG4gICAgICAgIHJldHVybiBbc3RhcnQsIGVuZF07XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5fbGF6eUxhbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZSwgbGFuZ0RhdGEsIGxhbmd1YWdlcywgX3JlZjtcclxuXHJcbiAgICAgICAgbGFuZ0RhdGEgPSB0aGlzLnN0YXJ0LmxhbmcoKTtcclxuICAgICAgICBpZiAoKGxhbmdEYXRhICE9IG51bGwpICYmIHRoaXMuZW5kLmxhbmcoKS5fYWJiciAhPT0gbGFuZ0RhdGEuX2FiYnIpIHtcclxuICAgICAgICAgIHRoaXMuZW5kLmxhbmcobGFuZ0RhdGEuX2FiYnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoKHRoaXMubGFuZ0RhdGEgIT0gbnVsbCkgJiYgdGhpcy5sYW5nRGF0YS5fYWJiciA9PT0gbGFuZ0RhdGEuX2FiYnIpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGhhc01vZHVsZSAmJiAhKGxhbmd1YWdlc0xvYWRlZCB8fCBsYW5nRGF0YS5fYWJiciA9PT0gXCJlblwiKSkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGFuZ3VhZ2VzID0gcmVxdWlyZShcIi4vbGFuZ1wiKTtcclxuICAgICAgICAgICAgbGFuZ3VhZ2VzKG1vbWVudCwgVHdpeCk7XHJcbiAgICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHtcclxuICAgICAgICAgICAgZSA9IF9lcnJvcjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGxhbmd1YWdlc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmxhbmdEYXRhID0gKF9yZWYgPSBsYW5nRGF0YSAhPSBudWxsID8gbGFuZ0RhdGEuX3R3aXggOiB2b2lkIDApICE9IG51bGwgPyBfcmVmIDogVHdpeC5kZWZhdWx0cztcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLl9mb3JtYXRGbiA9IGZ1bmN0aW9uKG5hbWUsIG9wdGlvbnMpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYW5nRGF0YVtuYW1lXS5mbihvcHRpb25zKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLl9mb3JtYXRTbG90ID0gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxhbmdEYXRhW25hbWVdLnNsb3Q7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5fZm9ybWF0UHJlID0gZnVuY3Rpb24obmFtZSwgb3B0aW9ucykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5sYW5nRGF0YVtuYW1lXS5wcmUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMubGFuZ0RhdGFbbmFtZV0ucHJlKG9wdGlvbnMpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nRGF0YVtuYW1lXS5wcmU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuc2FtZURheSA9IGRlcHJlY2F0ZShcInNhbWVEYXlcIiwgXCJpc1NhbWUoJ2RheScpXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmlzU2FtZShcImRheVwiKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5zYW1lWWVhciA9IGRlcHJlY2F0ZShcInNhbWVZZWFyXCIsIFwiaXNTYW1lKCd5ZWFyJylcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNTYW1lKFwieWVhclwiKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5jb3VudERheXMgPSBkZXByZWNhdGUoXCJjb3VudERheXNcIiwgXCJjb3VudE91dGVyKCdkYXlzJylcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY291bnRPdXRlcihcImRheXNcIik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuZGF5c0luID0gZGVwcmVjYXRlKFwiZGF5c0luXCIsIFwiaXRlcmF0ZSgnZGF5cycgWyxtaW5Ib3Vyc10pXCIsIGZ1bmN0aW9uKG1pbkhvdXJzKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlcmF0ZSgnZGF5cycsIG1pbkhvdXJzKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5wYXN0ID0gZGVwcmVjYXRlKFwicGFzdFwiLCBcImlzUGFzdCgpXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmlzUGFzdCgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmR1cmF0aW9uID0gZGVwcmVjYXRlKFwiZHVyYXRpb25cIiwgXCJodW1hbml6ZUxlbmd0aCgpXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmh1bWFuaXplTGVuZ3RoKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUubWVyZ2UgPSBkZXByZWNhdGUoXCJtZXJnZVwiLCBcInVuaW9uKG90aGVyKVwiLCBmdW5jdGlvbihvdGhlcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVuaW9uKG90aGVyKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gVHdpeDtcclxuXHJcbiAgICB9KSgpO1xyXG4gICAgZ2V0UHJvdG90eXBlT2YgPSBmdW5jdGlvbihvKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgT2JqZWN0LmdldFByb3RvdHlwZU9mID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pO1xyXG4gICAgICB9IGVsc2UgaWYgKFwiXCIuX19wcm90b19fID09PSBTdHJpbmcucHJvdG90eXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIG8uX19wcm90b19fO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBvLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIFR3aXguX2V4dGVuZChnZXRQcm90b3R5cGVPZihtb21lbnQuZm4uX2xhbmcpLCB7XHJcbiAgICAgIF90d2l4OiBUd2l4LmRlZmF1bHRzXHJcbiAgICB9KTtcclxuICAgIFR3aXguZm9ybWF0VGVtcGxhdGUgPSBmdW5jdGlvbihsZWZ0U2lkZSwgcmlnaHRTaWRlKSB7XHJcbiAgICAgIHJldHVybiBcIlwiICsgbGVmdFNpZGUgKyBcIiAtIFwiICsgcmlnaHRTaWRlO1xyXG4gICAgfTtcclxuICAgIG1vbWVudC50d2l4ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xyXG4gICAgICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XHJcbiAgICAgICAgdmFyIGNoaWxkID0gbmV3IGN0b3IsIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY2hpbGQsIGFyZ3MpO1xyXG4gICAgICAgIHJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XHJcbiAgICAgIH0pKFR3aXgsIGFyZ3VtZW50cywgZnVuY3Rpb24oKXt9KTtcclxuICAgIH07XHJcbiAgICBtb21lbnQuZm4udHdpeCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gKGZ1bmN0aW9uKGZ1bmMsIGFyZ3MsIGN0b3IpIHtcclxuICAgICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xyXG4gICAgICAgIHZhciBjaGlsZCA9IG5ldyBjdG9yLCByZXN1bHQgPSBmdW5jLmFwcGx5KGNoaWxkLCBhcmdzKTtcclxuICAgICAgICByZXR1cm4gT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCA/IHJlc3VsdCA6IGNoaWxkO1xyXG4gICAgICB9KShUd2l4LCBbdGhpc10uY29uY2F0KF9fc2xpY2UuY2FsbChhcmd1bWVudHMpKSwgZnVuY3Rpb24oKXt9KTtcclxuICAgIH07XHJcbiAgICBtb21lbnQuZm4uZm9yRHVyYXRpb24gPSBmdW5jdGlvbihkdXJhdGlvbiwgYWxsRGF5KSB7XHJcbiAgICAgIHJldHVybiBuZXcgVHdpeCh0aGlzLCB0aGlzLmNsb25lKCkuYWRkKGR1cmF0aW9uKSwgYWxsRGF5KTtcclxuICAgIH07XHJcbiAgICBtb21lbnQuZHVyYXRpb24uZm4uYWZ0ZXJNb21lbnQgPSBmdW5jdGlvbihzdGFydGluZ1RpbWUsIGFsbERheSkge1xyXG4gICAgICByZXR1cm4gbmV3IFR3aXgoc3RhcnRpbmdUaW1lLCBtb21lbnQoc3RhcnRpbmdUaW1lKS5jbG9uZSgpLmFkZCh0aGlzKSwgYWxsRGF5KTtcclxuICAgIH07XHJcbiAgICBtb21lbnQuZHVyYXRpb24uZm4uYmVmb3JlTW9tZW50ID0gZnVuY3Rpb24oc3RhcnRpbmdUaW1lLCBhbGxEYXkpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUd2l4KG1vbWVudChzdGFydGluZ1RpbWUpLmNsb25lKCkuc3VidHJhY3QodGhpcyksIHN0YXJ0aW5nVGltZSwgYWxsRGF5KTtcclxuICAgIH07XHJcbiAgICBtb21lbnQudHdpeENsYXNzID0gVHdpeDtcclxuICAgIHJldHVybiBUd2l4O1xyXG4gIH07XHJcblxyXG4gIGlmIChoYXNNb2R1bGUpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbWFrZVR3aXgocmVxdWlyZShcIm1vbWVudFwiKSk7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICBkZWZpbmUoXCJ0d2l4XCIsIFtcIm1vbWVudFwiXSwgZnVuY3Rpb24obW9tZW50KSB7XHJcbiAgICAgIHJldHVybiBtYWtlVHdpeChtb21lbnQpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAodGhpcy5tb21lbnQgIT0gbnVsbCkge1xyXG4gICAgdGhpcy5Ud2l4ID0gbWFrZVR3aXgodGhpcy5tb21lbnQpO1xyXG4gIH1cclxuXHJcbn0pLmNhbGwodGhpcyk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuICBncnBoID0ge307XHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2F4aXNfY2F0ZWdvcmljYWwoKSB7XHJcblxyXG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfY2F0ZWdvcmljYWwoKTtcclxuICB2YXIgd2lkdGg7XHJcbiAgdmFyIHZhcmlhYmxlLCBoZWlnaHQ7XHJcblxyXG4gIHZhciBkdW1teV8gPSBkMy5zZWxlY3QoXCJib2R5XCIpLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNfY2F0ZWdvcmljYWwgZHVtbXlcIilcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgMCkuYXR0cihcImhlaWdodFwiLCAwKVxyXG4gICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICB2YXIgbGFiZWxfc2l6ZV8gPSBncnBoX2xhYmVsX3NpemUoZHVtbXlfKTtcclxuXHJcbiAgZnVuY3Rpb24gYXhpcyhnKSB7XHJcbiAgICB2YXIgdGlja3MgPSBheGlzLnRpY2tzKCk7XHJcbiAgICBnLmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIGF4aXMud2lkdGgoKSkuYXR0cihcImhlaWdodFwiLCBheGlzLmhlaWdodCgpKTtcclxuICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxyXG4gICAgICAuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrc1wiKVxyXG4gICAgICAuYXR0cihcIngxXCIsIGF4aXMud2lkdGgoKSAtIHNldHRpbmdzKFwidGlja19sZW5ndGhcIikpXHJcbiAgICAgIC5hdHRyKFwieDJcIiwgYXhpcy53aWR0aCgpKVxyXG4gICAgICAuYXR0cihcInkxXCIsIHNjYWxlLm0pLmF0dHIoXCJ5MlwiLCBzY2FsZS5tKTtcclxuICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tsYWJlbFwiKS5kYXRhKHRpY2tzKS5lbnRlcigpXHJcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tsYWJlbFwiKVxyXG4gICAgICAuYXR0cihcInhcIiwgYXhpcy53aWR0aCgpIC0gc2V0dGluZ3MoXCJ0aWNrX2xlbmd0aFwiKSAtIHNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKVxyXG4gICAgICAuYXR0cihcInlcIiwgc2NhbGUubSlcclxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDt9KVxyXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCIwLjM1ZW1cIik7XHJcbiAgICBnLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpc2xpbmVcIilcclxuICAgICAgLmF0dHIoXCJ4MVwiLCBheGlzLndpZHRoKCkpLmF0dHIoXCJ4MlwiLCBheGlzLndpZHRoKCkpXHJcbiAgICAgIC5hdHRyKFwieTFcIiwgMCkuIGF0dHIoXCJ5MlwiLCBheGlzLmhlaWdodCgpKTtcclxuICB9XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICB2YXIgdGlja3MgPSBzY2FsZS50aWNrcygpO1xyXG4gICAgICB2YXIgbWF4X3dpZHRoID0gMDtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aWNrcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIHZhciBsdyA9IGxhYmVsX3NpemVfLndpZHRoKHRpY2tzW2ldKTtcclxuICAgICAgICBpZiAobHcgPiBtYXhfd2lkdGgpIG1heF93aWR0aCA9IGx3O1xyXG4gICAgICB9XHJcbiAgICAgIHdpZHRoID0gbWF4X3dpZHRoICsgc2V0dGluZ3MoXCJ0aWNrX2xlbmd0aFwiKSArIHNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpOyAgXHJcbiAgICAgIHJldHVybiB3aWR0aDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpZHRoID0gdztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gaGVpZ2h0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGVpZ2h0ID0gaDtcclxuICAgICAgc2NhbGUucmFuZ2UoWzAsIGhdKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XHJcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcclxuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ3N0cmluZycgfHwgdnNjaGVtYS50eXBlID09ICdjYXRlZ29yaWNhbCcgfHxcclxuICAgICAgdnNjaGVtYS50eXBlID09ICdwZXJpb2QnO1xyXG4gIH07XHJcblxyXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFyaWFibGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXJpYWJsZSA9IHY7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gc2NhbGUuZG9tYWluKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgZCA9IGRhdGEubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbdmFyaWFibGVdO30pO1xyXG4gICAgICAvLyBmaWx0ZXIgb3V0IGR1cGxpY2F0ZSB2YWx1ZXNcclxuICAgICAgdmFyIGRvbWFpbiA9IGQuZmlsdGVyKGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgc2VsZikge1xyXG4gICAgICAgIHJldHVybiBzZWxmLmluZGV4T2YodmFsdWUpID09PSBpbmRleDtcclxuICAgICAgfSk7XHJcbiAgICAgIHNjYWxlLmRvbWFpbihkb21haW4pO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gc2NhbGUudGlja3MoKTtcclxuICB9O1xyXG5cclxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxyXG4gICAgICByZXR1cm4gc2NhbGUodlt2YXJpYWJsZV0pLm07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc2NhbGUodikubTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLnNjYWxlLmwgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIHJldHVybiBzY2FsZSh2W3ZhcmlhYmxlXSkubDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzY2FsZSh2KS5sO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUudSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcclxuICAgICAgcmV0dXJuIHNjYWxlKHZbdmFyaWFibGVdKS51O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHNjYWxlKHYpLnU7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZS53ID0gZnVuY3Rpb24odikge1xyXG4gICAgdmFyIHI7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIHIgPSBzY2FsZSh2W3ZhcmlhYmxlXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByID0gc2NhbGUodik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gci51IC0gci5sO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBheGlzO1xyXG59XHJcblxyXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xyXG5ncnBoLmF4aXMuY2F0ZWdvcmljYWwgPSBncnBoX2F4aXNfY2F0ZWdvcmljYWwoKTtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2F4aXNfY2hsb3JvcGxldGgoKSB7XHJcblxyXG4gIHZhciB2YXJpYWJsZTtcclxuICB2YXIgd2lkdGgsIGhlaWdodDtcclxuICB2YXIgc2NhbGUgPSBncnBoX3NjYWxlX2NobG9yb3BsZXRoKCk7XHJcblxyXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xyXG4gIH1cclxuXHJcbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHcpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB3aWR0aDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpZHRoID0gdztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gaGVpZ2h0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGVpZ2h0ID0gaDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XHJcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcclxuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ251bWJlcic7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB2YXJpYWJsZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhcmlhYmxlID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZS5kb21haW4oKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh2YXJpYWJsZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcztcclxuICAgICAgc2NhbGUuZG9tYWluKGQzLmV4dGVudChkYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlXTt9KSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIHJldHVybiBheGlzLnNjYWxlKHZbdmFyaWFibGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXhpcztcclxufVxyXG5cclxuaWYgKGdycGguYXhpcyA9PT0gdW5kZWZpbmVkKSBncnBoLmF4aXMgPSB7fTtcclxuZ3JwaC5heGlzLmNobG9yb3BsZXRoID0gZ3JwaF9heGlzX2NobG9yb3BsZXRoKCk7XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9heGlzX2NvbG91cigpIHtcclxuXHJcbiAgdmFyIHNjYWxlID0gZ3JwaF9zY2FsZV9jb2xvdXIoKTtcclxuICB2YXIgdmFyaWFibGVfO1xyXG4gIHZhciB3aWR0aF8sIGhlaWdodF87XHJcblxyXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xyXG4gIH1cclxuXHJcbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gd2lkdGhfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2lkdGhfID0gd2lkdGg7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaGVpZ2h0KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gaGVpZ2h0XztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xyXG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XHJcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09IFwiY2F0ZWdvcmljYWxcIiB8fCB2c2NoZW1hLnR5cGUgPT0gXCJwZXJpb2RcIjtcclxuICB9O1xyXG5cclxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHZhcmlhYmxlXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhcmlhYmxlXyA9IHY7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gc2NhbGUuZG9tYWluKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAodmFyaWFibGVfID09PSB1bmRlZmluZWQpIHJldHVybiB0aGlzO1xyXG4gICAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XHJcbiAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XHJcbiAgICAgIGlmICh2c2NoZW1hLnR5cGUgPT0gXCJjYXRlZ29yaWNhbFwiKSB7XHJcbiAgICAgICAgY2F0ZWdvcmllcyA9IHZzY2hlbWEuY2F0ZWdvcmllcy5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5uYW1lOyB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgdmFscyA9IGRhdGEubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbdmFyaWFibGVfXTt9KS5zb3J0KCk7XHJcbiAgICAgICAgdmFyIHByZXY7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWxzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICBpZiAodmFsc1tpXSAhPSBwcmV2KSBjYXRlZ29yaWVzLnB1c2goXCJcIiArIHZhbHNbaV0pO1xyXG4gICAgICAgICAgcHJldiA9IHZhbHNbaV07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHNjYWxlLmRvbWFpbihjYXRlZ29yaWVzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHNjYWxlLnRpY2tzKCk7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcclxuICAgICAgcmV0dXJuIHNjYWxlKHZbdmFyaWFibGVfXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc2NhbGUodik7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGF4aXM7XHJcbn1cclxuXHJcbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XHJcbmdycGguYXhpcy5jb2xvdXIgPSBncnBoX2F4aXNfY29sb3VyKCk7XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9heGlzX2xpbmVhcihob3Jpem9udGFsKSB7XHJcblxyXG4gIHZhciBzY2FsZV8gPSBncnBoX3NjYWxlX2xpbmVhcigpO1xyXG4gIHZhciBob3Jpem9udGFsXyA9IGhvcml6b250YWw7XHJcbiAgdmFyIHZhcmlhYmxlXztcclxuICB2YXIgd2lkdGhfLCBoZWlnaHRfO1xyXG4gIHZhciBvcmlnaW5fO1xyXG4gIHZhciBzZXR0aW5nc18gPSB7XHJcbiAgICBcInRpY2tfbGVuZ3RoXCIgOiA1LFxyXG4gICAgXCJ0aWNrX3BhZGRpbmdcIiA6IDIsXHJcbiAgICBcInBhZGRpbmdcIiA6IDRcclxuICB9O1xyXG5cclxuICB2YXIgZHVtbXlfID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5lYXJheGlzIGR1bW15XCIpXHJcbiAgICAuYXR0cihcIndpZHRoXCIsIDApLmF0dHIoXCJoZWlnaHRcIiwgMClcclxuICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgdmFyIGxhYmVsX3NpemVfID0gZ3JwaF9sYWJlbF9zaXplKGR1bW15Xyk7XHJcbiAgaWYgKGhvcml6b250YWxfKSBzY2FsZV8ubGFiZWxfc2l6ZShsYWJlbF9zaXplXy53aWR0aCk7XHJcbiAgZWxzZSBzY2FsZV8ubGFiZWxfc2l6ZShsYWJlbF9zaXplXy5oZWlnaHQpO1xyXG4gIFxyXG5cclxuICBmdW5jdGlvbiBheGlzKGcpIHtcclxuICAgIHZhciB3ID0gYXhpcy53aWR0aCgpO1xyXG4gICAgdmFyIHRpY2tzID0gYXhpcy50aWNrcygpO1xyXG4gICAgZy5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3KS5hdHRyKFwiaGVpZ2h0XCIsIGF4aXMuaGVpZ2h0KCkpO1xyXG4gICAgaWYgKGhvcml6b250YWwpIHtcclxuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja1wiKS5kYXRhKHRpY2tzKS5lbnRlcigpXHJcbiAgICAgICAgLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIFwidGlja1wiKVxyXG4gICAgICAgIC5hdHRyKFwieDFcIiwgc2NhbGVfKS5hdHRyKFwieDJcIiwgc2NhbGVfKVxyXG4gICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcInkyXCIsIHNldHRpbmdzXy50aWNrX2xlbmd0aCk7XHJcbiAgICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tsYWJlbFwiKS5kYXRhKHRpY2tzKS5lbnRlcigpXHJcbiAgICAgICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGlja2xhYmVsXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHNjYWxlXykuYXR0cihcInlcIiwgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoICsgc2V0dGluZ3NfLnRpY2tfcGFkZGluZylcclxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkO30pXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIwLjcxZW1cIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBnLnNlbGVjdEFsbChcIi50aWNrXCIpLmRhdGEodGlja3MpLmVudGVyKClcclxuICAgICAgICAuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCB3LXNldHRpbmdzXy50aWNrX2xlbmd0aCkuYXR0cihcIngyXCIsIHcpXHJcbiAgICAgICAgLmF0dHIoXCJ5MVwiLCBzY2FsZV8pLmF0dHIoXCJ5MlwiLCBzY2FsZV8pO1xyXG4gICAgICBnLnNlbGVjdEFsbChcIi50aWNrbGFiZWxcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxyXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tsYWJlbFwiKVxyXG4gICAgICAgIC5hdHRyKFwieFwiLCBzZXR0aW5nc18ucGFkZGluZykuYXR0cihcInlcIiwgc2NhbGVfKVxyXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7fSlcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiYmVnaW5cIilcclxuICAgICAgICAuYXR0cihcImR5XCIsIFwiMC4zNWVtXCIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICBpZiAoaG9yaXpvbnRhbF8pIHtcclxuICAgICAgLy8gaWYgaG9yaXpvbnRhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBnaXZlbjsgdGhpcyBkZWZpbmVzIHRoZSByYW5nZSBvZlxyXG4gICAgICAvLyB0aGUgc2NhbGVcclxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gd2lkdGhfO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHdpZHRoXyA9IHdpZHRoO1xyXG4gICAgICAgIHNjYWxlXy5yYW5nZShbMCwgd2lkdGhfXSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIGlmIHZlcnRpY2FsIHRoZSB3aWR0aCBpcyB1c3VhbGx5IGRlZmluZWQgYnkgdGhlIGdyYXBoOiB0aGUgc3BhY2UgaXRcclxuICAgICAgLy8gbmVlZHMgdG8gZHJhdyB0aGUgdGlja21hcmtzIGFuZCBsYWJlbHMgZXRjLiBcclxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICB2YXIgdGlja3MgPSBzY2FsZV8udGlja3MoKTtcclxuICAgICAgICB2YXIgdyA9IDA7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aWNrcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgdmFyIGx3ID0gbGFiZWxfc2l6ZV8ud2lkdGgodGlja3NbaV0pO1xyXG4gICAgICAgICAgaWYgKGx3ID4gdykgdyA9IGx3O1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aWR0aF8gPSB3ICsgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoICsgc2V0dGluZ3NfLnRpY2tfcGFkZGluZyArIHNldHRpbmdzXy5wYWRkaW5nOyAgXHJcbiAgICAgICAgcmV0dXJuIHdpZHRoXztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB3aWR0aF8gPSB3aWR0aDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaGVpZ2h0KSB7XHJcbiAgICBpZiAoaG9yaXpvbnRhbF8pIHtcclxuICAgICAgLy8gaWYgaG9yaXpvbnRhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBkZWZpbmVkIGJ5IHRoZSBncmFwaDogdGhlIHNwYWNlIGl0XHJcbiAgICAgIC8vIG5lZWRzIHRvIGRyYXcgdGhlIHRpY2ttYXJrcyBhbmQgbGFiZWxzIGV0Yy4gXHJcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgdmFyIHRpY2tzID0gc2NhbGVfLnRpY2tzKCk7XHJcbiAgICAgICAgdmFyIGggPSAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGlja3MubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgIHZhciBsaCA9IGxhYmVsX3NpemVfLmhlaWdodCh0aWNrc1tpXSk7XHJcbiAgICAgICAgICBpZiAobGggPiBoKSBoID0gbGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGhlaWdodF8gPSBoICsgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoICsgc2V0dGluZ3NfLnRpY2tfcGFkZGluZyArIHNldHRpbmdzXy5wYWRkaW5nOyBcclxuICAgICAgICByZXR1cm4gaGVpZ2h0XztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBoZWlnaHRfID0gaGVpZ2h0O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBpZiB2ZXJ0aWNhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBnaXZlbjsgdGhpcyBkZWZpbmVzIHRoZSByYW5nZSBvZlxyXG4gICAgICAvLyB0aGUgc2NhbGVcclxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gaGVpZ2h0XztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBoZWlnaHRfID0gaGVpZ2h0O1xyXG4gICAgICAgIHNjYWxlXy5yYW5nZShbaGVpZ2h0XywgMF0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XHJcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcclxuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ251bWJlcic7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB2YXJpYWJsZV87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXJpYWJsZV8gPSB2O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHNjYWxlXy5kb21haW4oKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciByYW5nZSA9IGQzLmV4dGVudChkYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiArZFt2YXJpYWJsZV9dO30pO1xyXG4gICAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XHJcbiAgICAgIGlmICh2c2NoZW1hLm9yaWdpbikgb3JpZ2luXyA9IHZzY2hlbWEub3JpZ2luO1xyXG4gICAgICBpZiAob3JpZ2luXyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgaWYgKHJhbmdlWzBdID4gb3JpZ2luXykgcmFuZ2VbMF0gPSBvcmlnaW5fO1xyXG4gICAgICAgIGlmIChyYW5nZVsxXSA8IG9yaWdpbl8pIHJhbmdlWzFdID0gb3JpZ2luXztcclxuICAgICAgfVxyXG4gICAgICBzY2FsZV8uZG9tYWluKHJhbmdlKS5uaWNlKCk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMub3JpZ2luID0gZnVuY3Rpb24ob3JpZ2luKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gb3JpZ2luXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG9yaWdpbl8gPSBvcmlnaW47XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBzY2FsZV8udGlja3MoKTtcclxuICB9O1xyXG5cclxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxyXG4gICAgICByZXR1cm4gc2NhbGVfKHZbdmFyaWFibGVfXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc2NhbGVfKHYpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBheGlzO1xyXG59XHJcblxyXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xyXG5ncnBoLmF4aXMubGluZWFyID0gZ3JwaF9heGlzX2xpbmVhcigpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19wZXJpb2QoKSB7XHJcblxyXG4gIHZhciBzY2FsZV8gPSBncnBoX3NjYWxlX3BlcmlvZCgpO1xyXG4gIHZhciBoZWlnaHRfO1xyXG4gIHZhciB2YXJpYWJsZV87XHJcbiAgdmFyIHNldHRpbmdzID0ge1xyXG4gICAgXCJ0aWNrX2xlbmd0aFwiIDogWzE1LCAzMCwgNDVdXHJcbiAgfTtcclxuXHJcbiAgdmFyIGF4aXMgPSBmdW5jdGlvbihnKSB7XHJcbiAgICB2YXIgdGlja3MgPSBzY2FsZV8udGlja3MoKTtcclxuXHJcbiAgICB2YXIgdGlja19sZW5ndGggPSB7fTtcclxuICAgIHZhciB0aWNrID0gMDtcclxuICAgIGlmIChzY2FsZV8uaGFzX21vbnRoKCkpIHRpY2tfbGVuZ3RoLm1vbnRoID0gc2V0dGluZ3MudGlja19sZW5ndGhbdGljaysrXTtcclxuICAgIGlmIChzY2FsZV8uaGFzX3F1YXJ0ZXIoKSkgdGlja19sZW5ndGgucXVhcnRlciA9IHNldHRpbmdzLnRpY2tfbGVuZ3RoW3RpY2srK107XHJcbiAgICB0aWNrX2xlbmd0aC55ZWFyID0gc2V0dGluZ3MudGlja19sZW5ndGhbdGljaysrXTtcclxuXHJcbiAgICBnLnNlbGVjdEFsbChcImxpbmUudGljay1lbmRcIikuZGF0YSh0aWNrcykuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXHJcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCkgeyBcclxuICAgICAgICB2YXIgbGFzdCA9IGQubGFzdCA/IFwiIHRpY2tsYXN0XCIgOiBcIlwiO1xyXG4gICAgICAgIHJldHVybiBcInRpY2sgdGlja2VuZCB0aWNrXCIgKyBkLnR5cGUgKyBsYXN0O1xyXG4gICAgICB9KVxyXG4gICAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHNjYWxlXyhkLnBlcmlvZC5lbmQpO30pXHJcbiAgICAgIC5hdHRyKFwieTFcIiwgMClcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBzY2FsZV8oZC5wZXJpb2QuZW5kKTt9KVxyXG4gICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHRpY2tfbGVuZ3RoW2QudHlwZV07fSk7XHJcbiAgICBnLnNlbGVjdEFsbChcImxpbmUudGljay1zdGFydFwiKS5kYXRhKHRpY2tzKS5lbnRlcigpLmFwcGVuZChcImxpbmVcIilcclxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7IFxyXG4gICAgICAgIHZhciBsYXN0ID0gZC5sYXN0ID8gXCIgdGlja2xhc3RcIiA6IFwiXCI7XHJcbiAgICAgICAgcmV0dXJuIFwidGljayB0aWNrc3RhcnQgdGlja1wiICsgZC50eXBlICsgbGFzdDtcclxuICAgICAgfSlcclxuICAgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBzY2FsZV8oZC5wZXJpb2Quc3RhcnQpO30pXHJcbiAgICAgIC5hdHRyKFwieTFcIiwgMClcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBzY2FsZV8oZC5wZXJpb2Quc3RhcnQpO30pXHJcbiAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gdGlja19sZW5ndGhbZC50eXBlXTt9KTtcclxuICAgIGcuc2VsZWN0QWxsKFwidGV4dFwiKS5kYXRhKHRpY2tzKS5lbnRlcigpLmFwcGVuZChcInRleHRcIilcclxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRpY2tsYWJlbCB0aWNrbGFiZWxcIiArIGQudHlwZTt9KVxyXG4gICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gc2NhbGVfKGQuZGF0ZSk7fSlcclxuICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHRpY2tfbGVuZ3RoW2QudHlwZV07fSlcclxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IFxyXG4gICAgICAgIGlmIChkLnR5cGUgPT0gXCJtb250aFwiKSB7XHJcbiAgICAgICAgICByZXR1cm4gZC5wZXJpb2Quc3RhcnQuZm9ybWF0KFwiTU1NXCIpLmNoYXJBdCgwKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGQudHlwZSA9PSBcInF1YXJ0ZXJcIikge1xyXG4gICAgICAgICAgcmV0dXJuIFwiUVwiICsgZC5wZXJpb2Quc3RhcnQuZm9ybWF0KFwiUVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGQubGFiZWw7XHJcbiAgICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaGVpZ2h0Xykge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgaWYgKGhlaWdodF8gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHZhciB0aWNrID0gMDtcclxuICAgICAgICBpZiAoc2NhbGVfLmhhc19tb250aCkgdGljaysrO1xyXG4gICAgICAgIGlmIChzY2FsZV8uaGFzX3F1YXJ0ZXIpIHRpY2srKztcclxuICAgICAgICByZXR1cm4gc2V0dGluZ3MudGlja19sZW5ndGhbdGlja107XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGhlaWdodF87XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgdmFyIHIgPSBzY2FsZV8ucmFuZ2UoKTtcclxuICAgICAgcmV0dXJuIHJbMV0gLSByWzBdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2NhbGVfLnJhbmdlKFswLCB3aWR0aF0pO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xyXG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSAnZGF0ZScgfHwgdnNjaGVtYS50eXBlID09ICdwZXJpb2QnO1xyXG4gIH07XHJcblxyXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyaWFibGVfID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZV8uZG9tYWluKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgZG9tYWluID0gZGF0YS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV9dO30pO1xyXG4gICAgICBzY2FsZV8uZG9tYWluKGRvbWFpbik7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgdGlja3MgPSBzY2FsZV8udGlja3MoKTtcclxuICAgIHJldHVybiB0aWNrcy5maWx0ZXIoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50eXBlID09IFwieWVhclwiO30pO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIGlmICh2Lmhhc093blByb3BlcnR5KFwiZGF0ZVwiKSAmJiB2Lmhhc093blByb3BlcnR5KFwicGVyaW9kXCIpKSB7XHJcbiAgICAgICAgcmV0dXJuIHNjYWxlXyh2KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gc2NhbGVfKHZbdmFyaWFibGVfXSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzY2FsZV8odik7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIHJldHVybiBheGlzO1xyXG59XHJcblxyXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xyXG5ncnBoLmF4aXMucGVyaW9kID0gZ3JwaF9heGlzX3BlcmlvZCgpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19yZWdpb24oKSB7XHJcblxyXG4gIHZhciB2YXJpYWJsZV87XHJcbiAgdmFyIHdpZHRoXywgaGVpZ2h0XztcclxuICB2YXIgbWFwX2xvYWRlZF87XHJcbiAgdmFyIG1hcF87XHJcbiAgdmFyIGluZGV4XyA9IHt9O1xyXG5cclxuICBmdW5jdGlvbiBheGlzKGcpIHtcclxuICB9XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHdpZHRoXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHVwZGF0ZV9wcm9qZWN0aW9uXyA9IHVwZGF0ZV9wcm9qZWN0aW9uXyB8fCB3aWR0aF8gIT0gd2lkdGg7XHJcbiAgICAgIHdpZHRoXyA9IHdpZHRoO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGhlaWdodF87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB1cGRhdGVfcHJvamVjdGlvbl8gPSB1cGRhdGVfcHJvamVjdGlvbl8gfHwgaGVpZ2h0XyAhPSBoZWlnaHQ7XHJcbiAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xyXG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XHJcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdzdHJpbmcnO1xyXG4gIH07XHJcblxyXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyaWFibGVfID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gVmFyaWFibGUgYW5kIGZ1bmN0aW9uIHRoYXQga2VlcHMgdHJhY2sgb2Ygd2hldGhlciBvciBub3QgdGhlIG1hcCBoYXMgXHJcbiAgLy8gZmluaXNoZWQgbG9hZGluZy4gVGhlIG1ldGhvZCBkb21haW4oKSBsb2FkcyB0aGUgbWFwLiBIb3dldmVyLCB0aGlzIGhhcHBlbnNcclxuICAvLyBhc3luY2hyb25vdXNseS4gVGhlcmVmb3JlLCBpdCBpcyBwb3NzaWJsZSAoYW5kIG9mdGVuIGhhcHBlbnMpIHRoYXQgdGhlIG1hcFxyXG4gIC8vIGhhcyBub3QgeWV0IGxvYWRlZCB3aGVuIHNjYWxlKCkgYW5kIHRyYW5zZm9ybSgpIGFyZSBjYWxsZWQuIFRoZSBjb2RlIFxyXG4gIC8vIGNhbGxpbmcgdGhlc2UgbWV0aG9kcyB0aGVyZWZvcmUgbmVlZHMgdG8gd2FpdCB1bnRpbCB0aGUgbWFwIGhhcyBsb2FkZWQuIFxyXG4gIHZhciBtYXBfbG9hZGluZ18gPSBmYWxzZTsgXHJcbiAgYXhpcy5tYXBfbG9hZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gIW1hcF9sb2FkaW5nXztcclxuICB9O1xyXG5cclxuICBmdW5jdGlvbiBsb2FkX21hcChkYXRhLCBzY2hlbWEsIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAodmFyaWFibGVfID09PSB1bmRlZmluZWQpIHJldHVybiA7IC8vIFRPRE9cclxuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcclxuICAgIGlmICh2c2NoZW1hLm1hcCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gOyAvLyBUT0RPXHJcbiAgICBpZiAodnNjaGVtYS5tYXAgPT0gbWFwX2xvYWRlZF8pIHJldHVybjsgXHJcbiAgICBtYXBfbG9hZGluZ18gPSB0cnVlO1xyXG4gICAgLy8gVE9ETyBoYW5kbGUgZXJyb3JzIGluIGQzLmpzb25cclxuICAgIGQzLmpzb24odnNjaGVtYS5tYXAsIGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgbWFwX2xvYWRlZF8gPSB2c2NoZW1hLm1hcDtcclxuICAgICAgY2FsbGJhY2soanNvbik7XHJcbiAgICAgIG1hcF9sb2FkaW5nXyA9IGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgLy9yZXR1cm4gc2NhbGUuZG9tYWluKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsb2FkX21hcChkYXRhLCBzY2hlbWEsIGZ1bmN0aW9uKG1hcCkge1xyXG4gICAgICAgIG1hcF8gPSBtYXA7XHJcbiAgICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gdHJ1ZTtcclxuICAgICAgICAvLyBidWlsZCBpbmRleCBtYXBwaW5nIHJlZ2lvbiBuYW1lIG9uIGZlYXR1cmVzIFxyXG4gICAgICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcclxuICAgICAgICB2YXIgcmVnaW9uaWQgPSB2c2NoZW1hLnJlZ2lvbmlkIHx8IFwiaWRcIjtcclxuICAgICAgICBmb3IgKHZhciBmZWF0dXJlIGluIG1hcF8uZmVhdHVyZXMpIHtcclxuICAgICAgICAgIHZhciBuYW1lID0gbWFwXy5mZWF0dXJlc1tmZWF0dXJlXS5wcm9wZXJ0aWVzW3JlZ2lvbmlkXTtcclxuICAgICAgICAgIGluZGV4X1tuYW1lXSA9IGZlYXR1cmU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcclxuICAgICAgcmV0dXJuIGF4aXMuc2NhbGUodlt2YXJpYWJsZV9dKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGF4aXMudXBkYXRlX3Byb2plY3Rpb24oKTtcclxuICAgICAgcmV0dXJuIHBhdGhfKG1hcF8uZmVhdHVyZXNbaW5kZXhfW3ZdXSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gVGhlIHByb2plY3Rpb24uIENhbGN1bGF0aW5nIHRoZSBzY2FsZSBhbmQgdHJhbnNsYXRpb24gb2YgdGhlIHByb2plY3Rpb24gXHJcbiAgLy8gdGFrZXMgdGltZS4gVGhlcmVmb3JlLCB3ZSBvbmx5IHdhbnQgdG8gZG8gdGhhdCB3aGVuIG5lY2Vzc2FyeS4gXHJcbiAgLy8gdXBkYXRlX3Byb2plY3Rpb25fIGtlZXBzIHRyYWNrIG9mIHdoZXRoZXIgb3Igbm90IHRoZSBwcm9qZWN0aW9uIG5lZWRzIFxyXG4gIC8vIHJlY2FsY3VsYXRpb25cclxuICB2YXIgdXBkYXRlX3Byb2plY3Rpb25fID0gdHJ1ZTtcclxuICAvLyB0aGUgcHJvamVjdGlvblxyXG4gIHZhciBwcm9qZWN0aW9uXyA9IGQzLmdlby50cmFuc3ZlcnNlTWVyY2F0b3IoKVxyXG4gICAgLnJvdGF0ZShbLTUuMzg3MjA2MjEsIC01Mi4xNTUxNzQ0MF0pLnNjYWxlKDEpLnRyYW5zbGF0ZShbMCwwXSk7XHJcbiAgdmFyIHBhdGhfID0gZDMuZ2VvLnBhdGgoKS5wcm9qZWN0aW9uKHByb2plY3Rpb25fKTtcclxuICAvLyBmdW5jdGlvbiB0aGF0IHJlY2FsY3VsYXRlcyB0aGUgc2NhbGUgYW5kIHRyYW5zbGF0aW9uIG9mIHRoZSBwcm9qZWN0aW9uXHJcbiAgYXhpcy51cGRhdGVfcHJvamVjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKHVwZGF0ZV9wcm9qZWN0aW9uXyAmJiBtYXBfKSB7XHJcbiAgICAgIHByb2plY3Rpb25fLnNjYWxlKDEpLnRyYW5zbGF0ZShbMCwwXSk7XHJcbiAgICAgIHBhdGhfID0gZDMuZ2VvLnBhdGgoKS5wcm9qZWN0aW9uKHByb2plY3Rpb25fKTtcclxuICAgICAgdmFyIGJvdW5kcyA9IHBhdGhfLmJvdW5kcyhtYXBfKTtcclxuICAgICAgdmFyIHNjYWxlICA9IDAuOTUgLyBNYXRoLm1heCgoYm91bmRzWzFdWzBdIC0gYm91bmRzWzBdWzBdKSAvIHdpZHRoXywgXHJcbiAgICAgICAgICAgICAgICAgIChib3VuZHNbMV1bMV0gLSBib3VuZHNbMF1bMV0pIC8gaGVpZ2h0Xyk7XHJcbiAgICAgIHZhciB0cmFuc2wgPSBbKHdpZHRoXyAtIHNjYWxlICogKGJvdW5kc1sxXVswXSArIGJvdW5kc1swXVswXSkpIC8gMiwgXHJcbiAgICAgICAgICAgICAgICAgIChoZWlnaHRfIC0gc2NhbGUgKiAoYm91bmRzWzFdWzFdICsgYm91bmRzWzBdWzFdKSkgLyAyXTtcclxuICAgICAgcHJvamVjdGlvbl8uc2NhbGUoc2NhbGUpLnRyYW5zbGF0ZSh0cmFuc2wpO1xyXG4gICAgICB1cGRhdGVfcHJvamVjdGlvbl8gPSBmYWxzZTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcbiAgcmV0dXJuIGF4aXM7XHJcbn1cclxuXHJcbi8vIEEgZnVuY3Rpb24gZXhwZWN0aW5nIHR3byBmdW5jdGlvbnMuIFRoZSBzZWNvbmQgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gdGhlIFxyXG4vLyBmaXJzdCBmdW5jdGlvbiByZXR1cm5zIHRydWUuIFdoZW4gdGhlIGZpcnN0IGZ1bmN0aW9uIGRvZXMgbm90IHJldHVybiB0cnVlXHJcbi8vIHdlIHdhaXQgZm9yIDEwMG1zIGFuZCB0cnkgYWdhaW4uIFxyXG52YXIgd2FpdF9mb3IgPSBmdW5jdGlvbihtLCBmKSB7XHJcbiAgaWYgKG0oKSkge1xyXG4gICAgZigpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB3YWl0X2ZvcihtLCBmKTt9LCAxMDApO1xyXG4gIH1cclxufTtcclxuXHJcbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XHJcbmdycGguYXhpcy5saW5lYXIgPSBncnBoX2F4aXNfbGluZWFyKCk7XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9heGlzX3NpemUoKSB7XHJcblxyXG4gIHZhciB2YXJpYWJsZV87XHJcbiAgdmFyIHdpZHRoLCBoZWlnaHQ7XHJcbiAgdmFyIHNjYWxlID0gZ3JwaF9zY2FsZV9zaXplKCk7XHJcblxyXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xyXG4gIH1cclxuXHJcbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHcpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB3aWR0aDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpZHRoID0gdztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gaGVpZ2h0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGVpZ2h0ID0gaDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XHJcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcclxuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ251bWJlcic7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB2YXJpYWJsZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhcmlhYmxlID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZS5kb21haW4oKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh2YXJpYWJsZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcztcclxuICAgICAgc2NhbGUuZG9tYWluKGQzLmV4dGVudChkYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlXTt9KSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIHJldHVybiBheGlzLnNjYWxlKHZbdmFyaWFibGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXhpcztcclxufVxyXG5cclxuaWYgKGdycGguYXhpcyA9PT0gdW5kZWZpbmVkKSBncnBoLmF4aXMgPSB7fTtcclxuZ3JwaC5heGlzLnNpemUgPSBncnBoX2F4aXNfc2l6ZSgpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19zcGxpdCgpIHtcclxuXHJcbiAgdmFyIHZhcmlhYmxlXztcclxuICB2YXIgd2lkdGhfLCBoZWlnaHRfO1xyXG4gIHZhciBkb21haW5fO1xyXG4gIHZhciB0aWNrc187XHJcbiAgdmFyIHNldHRpbmdzXyA9IHtcclxuICB9O1xyXG5cclxuICBmdW5jdGlvbiBheGlzKGcpIHtcclxuICB9XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHdpZHRoXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpZHRoXyA9IHdpZHRoO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGhlaWdodF87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoZWlnaHRfID0gaGVpZ2h0O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xyXG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSBcImNhdGVnb3JpY2FsXCIgfHwgdnNjaGVtYS50eXBlID09IFwicGVyaW9kXCI7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB2YXJpYWJsZV87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXJpYWJsZV8gPSB2O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG4gXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBkb21haW5fO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHZhcmlhYmxlXyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcztcclxuICAgICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGVfLCBzY2hlbWEpO1xyXG4gICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xyXG4gICAgICBpZiAodnNjaGVtYS50eXBlID09IFwiY2F0ZWdvcmljYWxcIikge1xyXG4gICAgICAgIGNhdGVnb3JpZXMgPSB2c2NoZW1hLmNhdGVnb3JpZXMubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubmFtZTsgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIHZhbHMgPSBkYXRhLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlX107fSkuc29ydCgpO1xyXG4gICAgICAgIHZhciBwcmV2O1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFscy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgaWYgKHZhbHNbaV0gIT0gcHJldikgY2F0ZWdvcmllcy5wdXNoKFwiXCIgKyB2YWxzW2ldKTtcclxuICAgICAgICAgIHByZXYgPSB2YWxzW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBkb21haW5fID0gY2F0ZWdvcmllcztcclxuICAgICAgdmFyIGZvcm1hdCA9IHZhcmlhYmxlX3ZhbHVlX2Zvcm1hdHRlcih2YXJpYWJsZV8sIHNjaGVtYSk7XHJcbiAgICAgIHRpY2tzXyA9IGRvbWFpbl8ubWFwKGZvcm1hdCk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aWNrc187XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIHJldHVybiBkb21haW5fLmluZGV4T2Yodik7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGF4aXM7XHJcbn1cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19zd2l0Y2goYXhlcykge1xyXG5cclxuICB2YXIgdHlwZSA9IDA7XHJcblxyXG4gIHZhciBheGlzID0gZnVuY3Rpb24oZykge1xyXG4gICAgcmV0dXJuIGF4ZXNbdHlwZV0oZyk7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHRfKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gYXhlc1t0eXBlXS5oZWlnaHQoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZvciAodmFyIGk9MDsgaTxheGVzLmxlbmd0aDsgKytpKSBheGVzW2ldLmhlaWdodChoZWlnaHRfKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gYXhlc1t0eXBlXS53aWR0aCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZm9yICh2YXIgaT0wOyBpPGF4ZXMubGVuZ3RoOyArK2kpIGF4ZXNbaV0ud2lkdGgod2lkdGgpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICAgIGZvciAodmFyIGk9MDsgaTxheGVzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIGlmIChheGVzW2ldLmFjY2VwdCh2YXJpYWJsZSwgc2NoZW1hKSlcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9O1xyXG5cclxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGF4ZXNbdHlwZV0udmFyaWFibGUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZvciAodmFyIGk9MDsgaTxheGVzLmxlbmd0aDsgKytpKSBheGVzW2ldLnZhcmlhYmxlKHYpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGF4ZXNbdHlwZV0udmFyaWFibGUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4aXMudmFyaWFibGUoKTtcclxuICAgICAgZm9yICh2YXIgaT0wOyBpPGF4ZXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICBpZiAoYXhlc1tpXS5hY2NlcHQodmFyaWFibGUsIHNjaGVtYSkpIHtcclxuICAgICAgICAgIHR5cGUgPSBpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGF4ZXNbdHlwZV0uZG9tYWluKGRhdGEsIHNjaGVtYSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gYXhlc1t0eXBlXS50aWNrcygpO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICByZXR1cm4gYXhlc1t0eXBlXS5zY2FsZSh2KTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gYXhpcztcclxufVxyXG4iLCJcclxuZnVuY3Rpb24gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHNjaGVtYS5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgIGlmIChzY2hlbWEuZmllbGRzW2ldLm5hbWUgPT0gdmFyaWFibGUpIFxyXG4gICAgICByZXR1cm4gc2NoZW1hLmZpZWxkc1tpXTtcclxuICB9XHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG5cclxuZnVuY3Rpb24gdmFyaWFibGVfdmFsdWVfZm9ybWF0dGVyKHZhcmlhYmxlLCBzY2hlbWEpe1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc2NoZW1hLmZpZWxkcy5sZW5ndGg7IGkrKyl7XHJcblx0XHR2YXIgZmllbGQgPSBzY2hlbWEuZmllbGRzW2ldO1xyXG5cdCAgICBpZiAoZmllbGQubmFtZSA9PSB2YXJpYWJsZSl7XHJcblx0XHRcdHN3aXRjaChmaWVsZC50eXBlKXtcclxuXHRcdFx0XHRjYXNlIFwibnVtYmVyXCI6e1xyXG5cdFx0XHRcdFx0cmV0dXJuIG51bWJlcl9mb3JtYXR0ZXIoZmllbGQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXNlIFwiY2F0ZWdvcmljYWxcIjp7XHJcblx0XHRcdFx0XHRyZXR1cm4gY2F0ZWdvcmljYWxfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FzZSBcInN0cmluZ1wiOntcclxuXHRcdFx0XHRcdHJldHVybiBjYXRlZ29yaWNhbF9mb3JtYXR0ZXIoZmllbGQpO1xyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdGRlZmF1bHQ6e1xyXG5cdFx0XHRcdFx0cmV0dXJuIGRlZmF1bHRfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHQgICAgfVxyXG5cdH1cclxuXHRyZXR1cm4gZGVmYXVsdF9mb3JtYXR0ZXIoKTtcclxufVxyXG4vLyBjcmVhdGVzIGEgZm9ybWF0dGVyIGZvciBwcmV0dHkgcHJpbnRpbmcgdmFsdWVzIGZvciBhIHNwZWNpZmljIGZpZWxkIFxyXG5mdW5jdGlvbiB2YWx1ZV9mb3JtYXR0ZXIoc2NoZW1hKXtcclxuXHR2YXIgZm9ybWF0dGVycyA9IHt9O1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc2NoZW1hLmZpZWxkcy5sZW5ndGg7IGkrKyl7XHJcblx0XHR2YXIgZmllbGQgPSBzY2hlbWEuZmllbGRzW2ldO1xyXG5cdFx0c3dpdGNoKGZpZWxkLnR5cGUpe1xyXG5cdFx0XHRjYXNlIFwibnVtYmVyXCI6e1xyXG5cdFx0XHRcdGZvcm1hdHRlcnNbZmllbGQubmFtZV0gPSBudW1iZXJfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXNlIFwiY2F0ZWdvcmljYWxcIjp7XHJcblx0XHRcdFx0Zm9ybWF0dGVyc1tmaWVsZC5uYW1lXSA9IGNhdGVnb3JpY2FsX2Zvcm1hdHRlcihmaWVsZCk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2FzZSBcInN0cmluZ1wiOntcclxuXHRcdFx0XHRmb3JtYXR0ZXJzW2ZpZWxkLm5hbWVdID0gY2F0ZWdvcmljYWxfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRkZWZhdWx0OntcclxuXHRcdFx0XHRmb3JtYXR0ZXJzW2ZpZWxkLm5hbWVdID0gZGVmYXVsdF9mb3JtYXR0ZXIoZmllbGQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZnVuY3Rpb24oZGF0dW0sIG5hbWUpe1xyXG5cdFx0cmV0dXJuIGZvcm1hdHRlcnNbbmFtZV0oZGF0dW1bbmFtZV0pO1xyXG5cdH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZmF1bHRfZm9ybWF0dGVyKGZpZWxkKXtcclxuXHRyZXR1cm4gZnVuY3Rpb24odmFsdWUpe1xyXG5cdFx0cmV0dXJuIHZhbHVlO1xyXG5cdH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhdGVnb3JpY2FsX2Zvcm1hdHRlcihmaWVsZCl7XHJcblx0dmFyIGNhdF90aXRsZXMgPSB7fTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkLmNhdGVnb3JpZXMubGVuZ3RoOyBpKyspe1xyXG5cdFx0dmFyIGNhdCA9IGZpZWxkLmNhdGVnb3JpZXNbaV07XHJcblx0XHRjYXRfdGl0bGVzW2NhdC5uYW1lXSA9IGNhdC50aXRsZSB8fCBjYXQubmFtZTtcclxuXHR9XHJcblx0cmV0dXJuIGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRcdHJldHVybiBjYXRfdGl0bGVzW3ZhbHVlXTtcclxuXHR9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBudW1iZXJfZm9ybWF0dGVyKGZpZWxkKXtcclxuXHQvL1RPRE8gdXNlIHJvdW5kaW5nP1xyXG5cdHZhciB1bml0ID0gZmllbGQudW5pdCB8fCBcIlwiO1xyXG5cdHJldHVybiBmdW5jdGlvbih2YWx1ZSl7XHJcblx0XHRyZXR1cm4gdmFsdWUgKyB1bml0IHx8IFwiLVwiO1xyXG5cdH07XHJcbn1cclxuIiwiXHJcblxyXG5mdW5jdGlvbiBkYXRlX3BlcmlvZChzdHIpIHtcclxuXHJcbiAgZnVuY3Rpb24gaXNfeWVhcihwZXJpb2QpIHtcclxuICAgIC8vIHN0YXJ0aW5nIG1vbnRoIHNob3VsZCBiZSAwXHJcbiAgICBpZiAocGVyaW9kLnN0YXJ0Lm1vbnRoKCkgIT09IDApIHJldHVybiBmYWxzZTtcclxuICAgIC8vIHN0YXJ0aW5nIGRheSBvZiBtb250aCBzaG91bGQgYmUgMVxyXG4gICAgaWYgKHBlcmlvZC5zdGFydC5kYXRlKCkgIT0gMSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgLy8gbGVuZ3RoIHNob3VsZCBiZSAxIHllYXJcclxuICAgIHJldHVybiBwZXJpb2QubGVuZ3RoKFwieWVhcnNcIikgPT0gMTtcclxuICB9XHJcbiAgZnVuY3Rpb24gaXNfcXVhcnRlcihwZXJpb2QpIHtcclxuICAgIC8vIHN0YXJ0aW5nIG1vbnRoIHNob3VsZCBiZSAwLCAzLCA2LCBvciA5XHJcbiAgICBpZiAoKHBlcmlvZC5zdGFydC5tb250aCgpICUgMykgIT09IDApIHJldHVybiBmYWxzZTtcclxuICAgIC8vIHN0YXJ0aW5nIGRheSBvZiBtb250aCBzaG91bGQgYmUgMVxyXG4gICAgaWYgKHBlcmlvZC5zdGFydC5kYXRlKCkgIT0gMSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgLy8gbGVuZ3RoIHNob3VsZCBiZSAzIG1vbnRoc1xyXG4gICAgcmV0dXJuIHBlcmlvZC5sZW5ndGgoXCJtb250aHNcIikgPT0gMztcclxuICB9XHJcbiAgZnVuY3Rpb24gaXNfbW9udGgocGVyaW9kKSB7XHJcbiAgICAvLyBzdGFydGluZyBkYXkgb2YgbW9udGggc2hvdWxkIGJlIDFcclxuICAgIGlmIChwZXJpb2Quc3RhcnQuZGF0ZSgpICE9IDEpIHJldHVybiBmYWxzZTtcclxuICAgIC8vIGxlbmd0aCBzaG91bGQgYmUgMSBtb250aHNcclxuICAgIHJldHVybiBwZXJpb2QubGVuZ3RoKFwibW9udGhzXCIpID09IDE7XHJcbiAgfVxyXG5cclxuICB2YXIgYmFzaWNfeWVhcl9yZWdleHAgPSAvXihcXGR7NH0pJC87XHJcbiAgdmFyIGJhc2ljX21vbnRoX3JlZ2V4cCA9IC9eKFxcZHs0fSlbTW0tXXsxfShcXGR7MSwyfSkkLztcclxuICB2YXIgYmFzaWNfcXVhcnRlcl9yZWdleHAgPSAvXihcXGR7NH0pW1FxXXsxfShcXGR7MSwyfSkkLztcclxuXHJcbiAgdmFyIHQwLCBkdCwgcCwgdCwgeWVhcjtcclxuICBpZiAoYmFzaWNfeWVhcl9yZWdleHAudGVzdChzdHIpKSB7XHJcbiAgICBzdHIgPSBiYXNpY195ZWFyX3JlZ2V4cC5leGVjKHN0cik7XHJcbiAgICB5ZWFyID0gK3N0clsxXTtcclxuICAgIHQwID0gbW9tZW50KFsrc3RyWzFdXSk7XHJcbiAgICBkdCA9IG1vbWVudC5kdXJhdGlvbigxLCBcInllYXJcIik7XHJcbiAgICBwICA9IGR0LmFmdGVyTW9tZW50KHQwKTtcclxuICAgIHQgID0gdDAuYWRkKG1vbWVudC5kdXJhdGlvbihwLmxlbmd0aCgpLzIpKTtcclxuICAgIHJldHVybiB7dHlwZTogXCJ5ZWFyXCIsIGRhdGU6IHQsIHBlcmlvZDogcH07XHJcbiAgfSBlbHNlIGlmIChiYXNpY19tb250aF9yZWdleHAudGVzdChzdHIpKSB7XHJcbiAgICBzdHIgPSBiYXNpY19tb250aF9yZWdleHAuZXhlYyhzdHIpO1xyXG4gICAgdDAgPSBtb21lbnQoWytzdHJbMV0sICtzdHJbMl0tMV0pO1xyXG4gICAgZHQgPSBtb21lbnQuZHVyYXRpb24oMSwgXCJtb250aFwiKTtcclxuICAgIHAgID0gZHQuYWZ0ZXJNb21lbnQodDApO1xyXG4gICAgdCAgPSB0MC5hZGQobW9tZW50LmR1cmF0aW9uKHAubGVuZ3RoKCkvMikpO1xyXG4gICAgcmV0dXJuIHt0eXBlOiBcIm1vbnRoXCIsIGRhdGU6IHQsIHBlcmlvZDogcH07XHJcbiAgfSBlbHNlIGlmIChiYXNpY19xdWFydGVyX3JlZ2V4cC50ZXN0KHN0cikpIHtcclxuICAgIHN0ciA9IGJhc2ljX3F1YXJ0ZXJfcmVnZXhwLmV4ZWMoc3RyKTtcclxuICAgIHllYXIgICAgPSArc3RyWzFdO1xyXG4gICAgdmFyIHF1YXJ0ZXIgPSArc3RyWzJdO1xyXG4gICAgdDAgPSBtb21lbnQoWytzdHJbMV0sICgrc3RyWzJdLTEpKjNdKTtcclxuICAgIGR0ID0gbW9tZW50LmR1cmF0aW9uKDMsIFwibW9udGhcIik7XHJcbiAgICBwICA9IGR0LmFmdGVyTW9tZW50KHQwKTtcclxuICAgIHQgID0gdDAuYWRkKG1vbWVudC5kdXJhdGlvbihwLmxlbmd0aCgpLzIpKTtcclxuICAgIHJldHVybiB7dHlwZTogXCJxdWFydGVyXCIsIGRhdGU6IHQsIHBlcmlvZDogcH07XHJcbiAgfSBlbHNlIGlmICh0eXBlb2Yoc3RyKSA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICBzdHIgPSBzdHIuc3BsaXQoXCIvXCIpO1xyXG4gICAgdDAgICA9IG1vbWVudChzdHJbMF0sIG1vbWVudC5JU09fODYwMSk7XHJcbiAgICBpZiAoc3RyLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgIGR0ID0gbW9tZW50LmR1cmF0aW9uKDApO1xyXG4gICAgICByZXR1cm4ge3R5cGU6IFwiZGF0ZVwiLCBkYXRlOiB0MCwgcGVyaW9kOiBkdC5hZnRlck1vbWVudCh0MCl9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZHQgPSBtb21lbnQuZHVyYXRpb24oc3RyWzFdKTtcclxuICAgICAgcCAgPSBkdC5hZnRlck1vbWVudCh0MCk7XHJcbiAgICAgIHQgID0gdDAuYWRkKG1vbWVudC5kdXJhdGlvbihwLmxlbmd0aCgpLzIpKTtcclxuICAgICAgdmFyIHR5cGUgPSBcInBlcmlvZFwiO1xyXG4gICAgICBpZiAoaXNfeWVhcihwKSkgeyBcclxuICAgICAgICB0eXBlID0gXCJ5ZWFyXCI7XHJcbiAgICAgIH0gZWxzZSBpZiAoaXNfcXVhcnRlcihwKSkgeyBcclxuICAgICAgICB0eXBlID0gXCJxdWFydGVyXCI7XHJcbiAgICAgIH0gZWxzZSBpZiAoaXNfbW9udGgocCkpIHtcclxuICAgICAgICB0eXBlID0gXCJtb250aFwiO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB7dHlwZTogdHlwZSwgZGF0ZTogdCwgcGVyaW9kOiBwfTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgdDAgICA9IG1vbWVudChzdHIpO1xyXG4gICAgZHQgPSBtb21lbnQuZHVyYXRpb24oMCk7XHJcbiAgICByZXR1cm4ge3R5cGU6IFwiZGF0ZVwiLCBkYXRlOiB0MCwgcGVyaW9kOiBkdC5hZnRlck1vbWVudCh0MCl9O1xyXG4gIH1cclxufVxyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfZ2VuZXJpY19ncmFwaChheGVzLCBkaXNwYXRjaCwgdHlwZSwgZ3JhcGhfcGFuZWwpIHtcclxuXHJcbiAgdmFyIGR1bW15XyA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwiZHVtbXkgZ3JhcGggZ3JhcGgtXCIgKyB0eXBlKVxyXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCAwKS5hdHRyKFwiaGVpZ2h0XCIsIDApXHJcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gIHZhciBsYWJlbF9zaXplXyA9IGdycGhfbGFiZWxfc2l6ZShkdW1teV8pO1xyXG5cclxuXHJcbiAgdmFyIGdyYXBoID0gZ3JwaF9ncmFwaChheGVzLCBkaXNwYXRjaCwgZnVuY3Rpb24oZykge1xyXG4gICAgZnVuY3Rpb24gbmVzdF9jb2x1bW4oZCkge1xyXG4gICAgICByZXR1cm4gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGRbYXhlcy5jb2x1bW4udmFyaWFibGUoKV0gOiAxO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbmVzdF9yb3coZCkge1xyXG4gICAgICByZXR1cm4gYXhlcy5yb3cudmFyaWFibGUoKSA/IGRbYXhlcy5yb3cudmFyaWFibGUoKV0gOiAxO1xyXG4gICAgfVxyXG4gICAgLy8gc2V0dXAgYXhlc1xyXG4gICAgZm9yICh2YXIgYXhpcyBpbiBheGVzKSBheGVzW2F4aXNdLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuICAgIC8vIGRldGVybWluZSBudW1iZXIgb2Ygcm93cyBhbmQgY29sdW1uc1xyXG4gICAgdmFyIG5jb2wgPSBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gYXhlcy5jb2x1bW4udGlja3MoKS5sZW5ndGggOiAxO1xyXG4gICAgdmFyIG5yb3cgPSBheGVzLnJvdy52YXJpYWJsZSgpID8gYXhlcy5yb3cudGlja3MoKS5sZW5ndGggOiAxO1xyXG4gICAgLy8gZ2V0IGxhYmVscyBhbmQgZGV0ZXJtaW5lIHRoZWlyIGhlaWdodFxyXG4gICAgdmFyIHZzY2hlbWF4ID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMueC52YXJpYWJsZSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcbiAgICB2YXIgeGxhYmVsID0gdnNjaGVtYXgudGl0bGU7XHJcbiAgICB2YXIgbGFiZWxfaGVpZ2h0ID0gbGFiZWxfc2l6ZV8uaGVpZ2h0KHhsYWJlbCkgKyBzZXR0aW5ncygnbGFiZWxfcGFkZGluZycpO1xyXG4gICAgdmFyIHZzY2hlbWF5ID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMueS52YXJpYWJsZSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcbiAgICB2YXIgeWxhYmVsID0gdnNjaGVtYXkudGl0bGU7XHJcbiAgICAvLyBzZXQgdGhlIHdpZHRoLCBoZWlnaHQgZW5kIGRvbWFpbiBvZiB0aGUgeC0gYW5kIHktYXhlcy4gV2UgbmVlZCBzb21lIFxyXG4gICAgLy8gaXRlcmF0aW9ucyBmb3IgdGhpcywgYXMgdGhlIGhlaWdodCBvZiB0aGUgeS1heGlzIGRlcGVuZHMgb2YgdGhlIGhlaWdodFxyXG4gICAgLy8gb2YgdGhlIHgtYXhpcywgd2hpY2ggZGVwZW5kcyBvbiB0aGUgbGFiZWxzIG9mIHRoZSB4LWF4aXMsIHdoaWNoIGRlcGVuZHNcclxuICAgIC8vIG9uIHRoZSB3aWR0aCBvZiB0aGUgeC1heGlzLCBldGMuIFxyXG4gICAgdmFyIHJvd2xhYmVsX3dpZHRoID0gYXhlcy5yb3cudmFyaWFibGUoKSA/IDMqbGFiZWxfaGVpZ2h0IDogMDtcclxuICAgIHZhciBjb2x1bW5sYWJlbF9oZWlnaHQgPSBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gMypsYWJlbF9oZWlnaHQgOiAwO1xyXG4gICAgdmFyIHcsIGg7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI7ICsraSkge1xyXG4gICAgICB3ID0gZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gXHJcbiAgICAgICAgYXhlcy55LndpZHRoKCkgLSBsYWJlbF9oZWlnaHQgLSByb3dsYWJlbF93aWR0aDtcclxuICAgICAgdyA9ICh3IC0gKG5jb2wtMSkqc2V0dGluZ3MoJ3NlcCcpKSAvIG5jb2w7XHJcbiAgICAgIGF4ZXMueC53aWR0aCh3KS5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcbiAgICAgIGggPSBncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMF0gLSBzZXR0aW5ncygncGFkZGluZycpWzJdIC0gXHJcbiAgICAgICAgYXhlcy54LmhlaWdodCgpIC0gbGFiZWxfaGVpZ2h0IC0gY29sdW1ubGFiZWxfaGVpZ2h0O1xyXG4gICAgICBoID0gKGggLSAobnJvdy0xKSpzZXR0aW5ncygnc2VwJykpIC8gbnJvdztcclxuICAgICAgYXhlcy55LmhlaWdodChoKS5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcbiAgICB9XHJcbiAgICB2YXIgbCA9IGF4ZXMueS53aWR0aCgpICsgc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSArIGxhYmVsX2hlaWdodDtcclxuICAgIHZhciB0ICA9IHNldHRpbmdzKCdwYWRkaW5nJylbMl0gKyBjb2x1bW5sYWJlbF9oZWlnaHQ7XHJcbiAgICAvLyBjcmVhdGUgZ3JvdXAgY29udGFpbmluZyBjb21wbGV0ZSBncmFwaFxyXG4gICAgZyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJncmFwaCBncmFwaC1cIiArIHR5cGUpO1xyXG4gICAgLy8gZHJhdyBsYWJlbHNcclxuICAgIHZhciB5Y2VudGVyID0gdCArIDAuNSooZ3JhcGguaGVpZ2h0KCkgLSBzZXR0aW5ncygncGFkZGluZycpWzBdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXSAtIFxyXG4gICAgICAgIGF4ZXMueC5oZWlnaHQoKSAtIGxhYmVsX2hlaWdodCk7XHJcbiAgICB2YXIgeGNlbnRlciA9IGwgKyAwLjUqKGdyYXBoLndpZHRoKCkgLSBzZXR0aW5ncygncGFkZGluZycpWzFdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVszXSAtIFxyXG4gICAgICAgIGF4ZXMueS53aWR0aCgpIC0gbGFiZWxfaGVpZ2h0KTtcclxuICAgIGcuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJsYWJlbCBsYWJlbC15XCIpXHJcbiAgICAgIC5hdHRyKFwieFwiLCBzZXR0aW5ncygncGFkZGluZycpWzFdKS5hdHRyKFwieVwiLCB5Y2VudGVyKVxyXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLnRleHQoeWxhYmVsKVxyXG4gICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSg5MCBcIiArIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gKyBcIiBcIiArIHljZW50ZXIgKyBcIilcIik7XHJcbiAgICBnLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwibGFiZWwgbGFiZWwteFwiKVxyXG4gICAgICAuYXR0cihcInhcIiwgeGNlbnRlcikuYXR0cihcInlcIiwgZ3JhcGguaGVpZ2h0KCktc2V0dGluZ3MoJ3BhZGRpbmcnKVswXSlcclxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS50ZXh0KHhsYWJlbCk7XHJcbiAgICBpZiAoYXhlcy5yb3cudmFyaWFibGUoKSkge1xyXG4gICAgICB2YXIgeHJvdyA9IGdyYXBoLndpZHRoKCkgLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gbGFiZWxfaGVpZ2h0O1xyXG4gICAgICB2YXIgdnNjaGVtYXJvdyA9IHZhcmlhYmxlX3NjaGVtYShheGVzLnJvdy52YXJpYWJsZSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcbiAgICAgIHZhciByb3dsYWJlbCA9IHZzY2hlbWFyb3cudGl0bGU7XHJcbiAgICAgIGcuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJsYWJlbCBsYWJlbC15XCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHhyb3cpLmF0dHIoXCJ5XCIsIHljZW50ZXIpXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS50ZXh0KHJvd2xhYmVsKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDkwIFwiICsgeHJvdyArIFwiIFwiICsgeWNlbnRlciArIFwiKVwiKTtcclxuICAgIH1cclxuICAgIGlmIChheGVzLmNvbHVtbi52YXJpYWJsZSgpKSB7XHJcbiAgICAgIHZhciB2c2NoZW1hY29sdW1uID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMuY29sdW1uLnZhcmlhYmxlKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuICAgICAgdmFyIGNvbHVtbmxhYmVsID0gdnNjaGVtYWNvbHVtbi50aXRsZTtcclxuICAgICAgZy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsIGxhYmVsLXlcIilcclxuICAgICAgICAuYXR0cihcInhcIiwgeGNlbnRlcikuYXR0cihcInlcIiwgc2V0dGluZ3MoXCJwYWRkaW5nXCIpWzJdKS5hdHRyKFwiZHlcIiwgXCIwLjcxZW1cIilcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLnRleHQoY29sdW1ubGFiZWwpO1xyXG4gICAgfVxyXG4gICAgLy8gY3JlYXRlIGVhY2ggb2YgdGhlIHBhbmVsc1xyXG4gICAgdmFyIGQgPSBkMy5uZXN0KCkua2V5KG5lc3RfY29sdW1uKS5rZXkobmVzdF9yb3cpLmVudHJpZXMoZ3JhcGguZGF0YSgpKTtcclxuICAgIGZvciAoaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIHZhciBkaiA9IGRbaV0udmFsdWVzO1xyXG4gICAgICB0ICA9IHNldHRpbmdzKCdwYWRkaW5nJylbMl0gKyBjb2x1bW5sYWJlbF9oZWlnaHQ7XHJcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGoubGVuZ3RoOyArK2opIHtcclxuICAgICAgICAvLyBkcmF3IHgtYXhpc1xyXG4gICAgICAgIGlmIChqID09IChkai5sZW5ndGgtMSkpIHtcclxuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzIGF4aXMteFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGwgKyBcIixcIiArICh0ICsgaCkgKyBcIilcIikuY2FsbChheGVzLngpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBkcmF3IHktYXhpc1xyXG4gICAgICAgIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpcyBheGlzLXlcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAobCAtIGF4ZXMueS53aWR0aCgpKSArIFwiLFwiICsgdCArIFwiKVwiKVxyXG4gICAgICAgICAgICAuY2FsbChheGVzLnkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBkcmF3IHJvdyBsYWJlbHNcclxuICAgICAgICBpZiAoaSA9PSAoZC5sZW5ndGgtMSkgJiYgYXhlcy5yb3cudmFyaWFibGUoKSkge1xyXG4gICAgICAgICAgdmFyIHJvd3RpY2sgPSBheGVzLnJvdy50aWNrcygpW2pdO1xyXG4gICAgICAgICAgdmFyIGdyb3cgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpcyBheGlzLXJvd1wiKVxyXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIChsICsgdykgKyBcIixcIiArIHQgKyBcIilcIik7XHJcbiAgICAgICAgICBncm93LmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIGxhYmVsX2hlaWdodCArIDIqc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGgpO1xyXG4gICAgICAgICAgZ3Jvdy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tsYWJlbFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgMCkuYXR0cihcInlcIiwgaC8yKVxyXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSg5MCBcIiArIFxyXG4gICAgICAgICAgICAgIChsYWJlbF9oZWlnaHQgLSBzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKSkgKyBcIiBcIiArIGgvMiArIFwiKVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLmF0dHIoXCJkeVwiLCBcIjAuMzVlbVwiKVxyXG4gICAgICAgICAgICAudGV4dChyb3d0aWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZHJhdyBjb2x1bW4gbGFiZWxzXHJcbiAgICAgICAgaWYgKGogPT09IDAgJiYgYXhlcy5jb2x1bW4udmFyaWFibGUoKSkge1xyXG4gICAgICAgICAgdmFyIGNvbHVtbnRpY2sgPSBheGVzLmNvbHVtbi50aWNrcygpW2ldO1xyXG4gICAgICAgICAgdmFyIGNvbHRpY2toID0gbGFiZWxfaGVpZ2h0ICsgMipzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKTtcclxuICAgICAgICAgIHZhciBnY29sdW1uID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXMgYXhpcy1jb2x1bW5cIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyAodCAtIGNvbHRpY2toKSArIFwiKVwiKTtcclxuICAgICAgICAgIGdjb2x1bW4uYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgdylcclxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgbGFiZWxfaGVpZ2h0ICsgMipzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKSk7XHJcbiAgICAgICAgICBnY29sdW1uLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGlja2xhYmVsXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCB3LzIpLmF0dHIoXCJ5XCIsIHNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKVxyXG4gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLmF0dHIoXCJkeVwiLCBcIjAuNzFlbVwiKVxyXG4gICAgICAgICAgICAudGV4dChjb2x1bW50aWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZHJhdyBib3ggZm9yIGdyYXBoXHJcbiAgICAgICAgdmFyIGdyID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInBhbmVsXCIpXHJcbiAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGwgKyBcIixcIiArIHQgKyBcIilcIik7XHJcbiAgICAgICAgZ3IuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpLmF0dHIoXCJoZWlnaHRcIiwgaCk7XHJcbiAgICAgICAgLy8gZHJhdyBncmlkXHJcbiAgICAgICAgdmFyIHh0aWNrcyA9IGF4ZXMueC50aWNrcygpO1xyXG4gICAgICAgIGdyLnNlbGVjdEFsbChcImxpbmUuZ3JpZHhcIikuZGF0YSh4dGlja3MpLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImdyaWQgZ3JpZHhcIilcclxuICAgICAgICAgIC5hdHRyKFwieDFcIiwgYXhlcy54LnNjYWxlKS5hdHRyKFwieDJcIiwgYXhlcy54LnNjYWxlKVxyXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieTJcIiwgaCk7XHJcbiAgICAgICAgdmFyIHl0aWNrcyA9IGF4ZXMueS50aWNrcygpO1xyXG4gICAgICAgIGdyLnNlbGVjdEFsbChcImxpbmUuZ3JpZHlcIikuZGF0YSh5dGlja3MpLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImdyaWQgZ3JpZHlcIilcclxuICAgICAgICAgIC5hdHRyKFwieDFcIiwgMCkuYXR0cihcIngyXCIsIHcpXHJcbiAgICAgICAgICAuYXR0cihcInkxXCIsIGF4ZXMueS5zY2FsZSkuYXR0cihcInkyXCIsIGF4ZXMueS5zY2FsZSk7XHJcbiAgICAgICAgLy8gYWRkIGNyb3NzaGFpcnMgdG8gZ3JhcGhcclxuICAgICAgICB2YXIgZ2Nyb3NzaCA9IGdyLmFwcGVuZChcImdcIikuY2xhc3NlZChcImNyb3NzaGFpcnNcIiwgdHJ1ZSk7XHJcbiAgICAgICAgZ2Nyb3NzaC5hcHBlbmQoXCJsaW5lXCIpLmNsYXNzZWQoXCJobGluZVwiLCB0cnVlKS5hdHRyKFwieDFcIiwgMClcclxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcIngyXCIsIGF4ZXMueC53aWR0aCgpKS5hdHRyKFwieTJcIiwgMClcclxuICAgICAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgICAgICAgZ2Nyb3NzaC5hcHBlbmQoXCJsaW5lXCIpLmNsYXNzZWQoXCJ2bGluZVwiLCB0cnVlKS5hdHRyKFwieDFcIiwgMClcclxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcIngyXCIsIDApLmF0dHIoXCJ5MlwiLCBheGVzLnkuaGVpZ2h0KCkpXHJcbiAgICAgICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgIC8vIGRyYXcgcGFuZWxcclxuICAgICAgICBncmFwaF9wYW5lbChnciwgZGpbal0udmFsdWVzKTtcclxuICAgICAgICAvLyBuZXh0IHBhbmVsXHJcbiAgICAgICAgdCArPSBheGVzLnkuaGVpZ2h0KCkgKyBzZXR0aW5ncygnc2VwJyk7XHJcbiAgICAgIH1cclxuICAgICAgbCArPSBheGVzLngud2lkdGgoKSArIHNldHRpbmdzKCdzZXAnKTtcclxuICAgIH1cclxuICAgIC8vIGZpbmlzaGVkIGRyYXdpbmcgY2FsbCByZWFkeSBldmVudFxyXG4gICAgZGlzcGF0Y2gucmVhZHkuY2FsbChnKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGdyYXBoO1xyXG59XHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBncmFwaCkge1xyXG5cclxuICB2YXIgd2lkdGgsIGhlaWdodDtcclxuICB2YXIgZGF0YSwgc2NoZW1hO1xyXG5cclxuICBncmFwaC5heGVzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gZDMua2V5cyhheGVzKTtcclxuICB9O1xyXG5cclxuICBncmFwaC53aWR0aCA9IGZ1bmN0aW9uKHcpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB3aWR0aDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpZHRoID0gdztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZ3JhcGguaGVpZ2h0ID0gZnVuY3Rpb24oaCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGhlaWdodDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhlaWdodCA9IGg7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGdyYXBoLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlcywgYXhpcykge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIGlmIChheGVzW2F4aXNdID09PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcclxuICAgICAgcmV0dXJuIGF4ZXNbYXhpc10uYWNjZXB0KHZhcmlhYmxlcywgc2NoZW1hKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZvciAodmFyIGkgaW4gYXhlcykge1xyXG4gICAgICAgIGlmICh2YXJpYWJsZXNbaV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgaWYgKGF4ZXNbaV0ucmVxdWlyZWQpIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmFyIGFjY2VwdCA9IGF4ZXNbaV0uYWNjZXB0KHZhcmlhYmxlc1tpXSwgc2NoZW1hKTtcclxuICAgICAgICAgIGlmICghYWNjZXB0KSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGdyYXBoLmFzc2lnbiA9IGZ1bmN0aW9uKHZhcmlhYmxlcykge1xyXG4gICAgZm9yICh2YXIgaSBpbiBheGVzKSBheGVzW2ldLnZhcmlhYmxlKHZhcmlhYmxlc1tpXSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBncmFwaC5zY2hlbWEgPSBmdW5jdGlvbihzKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gc2NoZW1hO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2NoZW1hID0gcztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZ3JhcGguZGF0YSA9IGZ1bmN0aW9uKGQsIHMpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZGF0YSA9IGQ7XHJcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgXHJcbiAgICAgICAgZ3JhcGguc2NoZW1hKHMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBncmFwaC5kaXNwYXRjaCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGRpc3BhdGNoO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBncmFwaDtcclxufVxyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfZ3JhcGhfYmFyKCkge1xyXG5cclxuICB2YXIgYXhlcyA9IHtcclxuICAgICd4JyA6IGdycGhfYXhpc19saW5lYXIodHJ1ZSkub3JpZ2luKDApLFxyXG4gICAgJ3knIDogZ3JwaF9heGlzX2NhdGVnb3JpY2FsKCksXHJcbiAgICAnY29sb3VyJzogZ3JwaF9heGlzX2NvbG91cigpLFxyXG4gICAgJ2NvbHVtbicgOiBncnBoX2F4aXNfc3BsaXQoKSxcclxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcclxuICB9O1xyXG4gIGF4ZXMueC5yZXF1aXJlZCA9IHRydWU7XHJcbiAgYXhlcy55LnJlcXVpcmVkID0gdHJ1ZTtcclxuICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaChcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIsIFwiY2xpY2tcIiwgXCJyZWFkeVwiKTtcclxuXHJcbiAgdmFyIGdyYXBoID0gZ3JwaF9nZW5lcmljX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBcImJhclwiLCBmdW5jdGlvbihnLCBkYXRhKSB7XHJcbiAgICBmdW5jdGlvbiBuZXN0X2NvbG91cihkKSB7XHJcbiAgICAgIHJldHVybiBheGVzLmNvbG91ci52YXJpYWJsZSgpID8gZFtheGVzLmNvbG91ci52YXJpYWJsZSgpXSA6IDE7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBnZXRfeChkKSB7XHJcbiAgICAgIHZhciB2ID0gYXhlcy54LnNjYWxlKGQpO1xyXG4gICAgICByZXR1cm4gdiA8IGF4ZXMueC5zY2FsZShvcmlnaW4pID8gdiA6IGF4ZXMueC5zY2FsZShvcmlnaW4pO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZ2V0X3dpZHRoKGQpIHtcclxuICAgICAgcmV0dXJuIE1hdGguYWJzKGF4ZXMueC5zY2FsZShkKSAtIGF4ZXMueC5zY2FsZShvcmlnaW4pKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGdldF95KGQpIHtcclxuICAgICAgcmV0dXJuIGF4ZXMueS5zY2FsZS5sKGQpICsgaSpheGVzLnkuc2NhbGUudyhkKS9uY29sb3VycztcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGdldF9oZWlnaHQoZCkge1xyXG4gICAgICByZXR1cm4gYXhlcy55LnNjYWxlLncoZCkvbmNvbG91cnM7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGQgPSBkMy5uZXN0KCkua2V5KG5lc3RfY29sb3VyKS5lbnRyaWVzKGRhdGEpO1xyXG4gICAgdmFyIG5jb2xvdXJzID0gZC5sZW5ndGg7XHJcbiAgICB2YXIgb3JpZ2luID0gYXhlcy54Lm9yaWdpbigpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIHZhciBjb2xvdXIgPSBheGVzLmNvbG91ci5zY2FsZShkW2ldLmtleSk7XHJcbiAgICAgIGcuc2VsZWN0QWxsKFwicmVjdC5cIiArIGNvbG91cikuZGF0YShkW2ldLnZhbHVlcykuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhciBcIiArIGNvbG91cikuYXR0cihcInhcIiwgZ2V0X3gpXHJcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBnZXRfd2lkdGgpLmF0dHIoXCJ5XCIsIGdldF95KS5hdHRyKFwiaGVpZ2h0XCIsIGdldF9oZWlnaHQpO1xyXG4gICAgfVxyXG4gICAgZy5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcIm9yaWdpblwiKVxyXG4gICAgICAuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZShvcmlnaW4pKVxyXG4gICAgICAuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZShvcmlnaW4pKVxyXG4gICAgICAuYXR0cihcInkxXCIsIDApLmF0dHIoXCJ5MlwiLCBheGVzLnkuaGVpZ2h0KCkpO1xyXG4gIH0pO1xyXG5cclxuICAvLyB3aGVuIGZpbmlzaGVkIGRyYXdpbmcgZ3JhcGg7IGFkZCBldmVudCBoYW5kbGVycyBcclxuICBkaXNwYXRjaC5vbihcInJlYWR5XCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gYWRkIGhvdmVyIGV2ZW50cyB0byB0aGUgbGluZXMgYW5kIHBvaW50c1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcclxuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xyXG4gICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSkub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XHJcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcclxuICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSkub24oXCJjbGlja1wiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XHJcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcclxuICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIExvY2FsIGV2ZW50IGhhbmRsZXJzXHJcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICBpZiAodmFyaWFibGUpIHtcclxuICAgICAgdmFyIGNsYXNzZXMgPSBheGVzLmNvbG91ci5zY2FsZShcIlwiICsgdmFsdWUpO1xyXG4gICAgICB2YXIgcmVnZXhwID0gL1xcYmNvbG91cihbMC05XSspXFxiLztcclxuICAgICAgdmFyIGNvbG91ciA9IHJlZ2V4cC5leGVjKGNsYXNzZXMpWzBdO1xyXG4gICAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZChcImNvbG91cmxvd1wiLCB0cnVlKTtcclxuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuXCIgKyBjb2xvdXIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiB0cnVlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuYXR0cihcInkxXCIsIGF4ZXMueS5zY2FsZShkKSkuYXR0cihcInkyXCIsIGF4ZXMueS5zY2FsZShkKSlcclxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5hdHRyKFwieDFcIiwgYXhlcy54LnNjYWxlKGQpKS5hdHRyKFwieDJcIiwgYXhlcy54LnNjYWxlKGQpKVxyXG4gICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKTtcclxuICB9KTtcclxuICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiBmYWxzZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICB9KTtcclxuXHJcbiAgLy8gVG9vbHRpcFxyXG4gIC8vIHdoZW4gZDMudGlwIGlzIGxvYWRlZFxyXG4gIGlmIChkMy50aXAgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgdmFyIHRpcCA9IGQzLnRpcCgpLmRpcmVjdGlvbihcInNlXCIpLmF0dHIoJ2NsYXNzJywgJ3RpcCB0aXAtYmFyJykuaHRtbChmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHsgXHJcbiAgICAgIHZhciBzY2hlbWEgPSBncmFwaC5zY2hlbWEoKTtcclxuICAgICAgdmFyIGZvcm1hdCA9IHZhbHVlX2Zvcm1hdHRlcihzY2hlbWEpO1xyXG4gICAgICB2YXIgc3RyID0gJyc7XHJcbiAgICAgIGZvciAodmFyIGkgaW4gc2NoZW1hLmZpZWxkcykge1xyXG4gICAgICAgIHZhciBmaWVsZCA9IHNjaGVtYS5maWVsZHNbaV07XHJcbiAgICAgICAgc3RyICs9IGZpZWxkLnRpdGxlICsgJzogJyArIGZvcm1hdChkLCBmaWVsZC5uYW1lKSArICc8L2JyPic7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJyZWFkeS50aXBcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuY2FsbCh0aXApO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcIm1vdXNlb3Zlci50aXBcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICAgIHRpcC5zaG93KHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwibW91c2VvdXQudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgICB0aXAuaGlkZSh2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZ3JhcGg7XHJcbn1cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfZ3JhcGhfYnViYmxlKCkge1xyXG5cclxuICB2YXIgYXhlcyA9IHtcclxuICAgICd4JyA6IGdycGhfYXhpc19saW5lYXIodHJ1ZSksXHJcbiAgICAneScgOiBncnBoX2F4aXNfbGluZWFyKGZhbHNlKSxcclxuICAgICdvYmplY3QnIDogZ3JwaF9heGlzX2NvbG91cigpLFxyXG4gICAgJ3NpemUnICAgOiBncnBoX2F4aXNfc2l6ZSgpLFxyXG4gICAgJ2NvbG91cicgOiBncnBoX2F4aXNfY29sb3VyKCksXHJcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxyXG4gICAgJ3JvdycgOiBncnBoX2F4aXNfc3BsaXQoKVxyXG4gIH07XHJcbiAgYXhlcy54LnJlcXVpcmVkID0gdHJ1ZTtcclxuICBheGVzLnkucmVxdWlyZWQgPSB0cnVlO1xyXG4gIGF4ZXMub2JqZWN0LnJlcXVpcmVkID0gdHJ1ZTtcclxuICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaChcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIsIFwiY2xpY2tcIiwgXCJyZWFkeVwiKTtcclxuXHJcbiAgdmFyIGdyYXBoID0gZ3JwaF9nZW5lcmljX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBcImJ1YmJsZVwiLCBmdW5jdGlvbihnLCBkYXRhKSB7XHJcbiAgICBmdW5jdGlvbiBuZXN0X29iamVjdChkKSB7XHJcbiAgICAgIHJldHVybiBheGVzLm9iamVjdC52YXJpYWJsZSgpID8gZFtheGVzLm9iamVjdC52YXJpYWJsZSgpXSA6IDE7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBuZXN0X2NvbG91cihkKSB7XHJcbiAgICAgIHJldHVybiBheGVzLmNvbG91ci52YXJpYWJsZSgpID8gZFtheGVzLmNvbG91ci52YXJpYWJsZSgpXSA6IDE7XHJcbiAgICB9XHJcbiAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2xvdXIpLmVudHJpZXMoZGF0YSk7XHJcbiAgICAvLyBkcmF3IGJ1YmJsZXMgXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcclxuICAgICAgZy5zZWxlY3RBbGwoXCJjaXJjbGUuYnViYmxlXCIgKyBpKS5kYXRhKGRbaV0udmFsdWVzKS5lbnRlcigpLmFwcGVuZChcImNpcmNsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJidWJibGUgYnViYmxlXCIgKyBpICsgXCIgXCIgKyBheGVzLmNvbG91ci5zY2FsZShkW2ldLmtleSkpXHJcbiAgICAgICAgLmF0dHIoXCJjeFwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJjeVwiLCBheGVzLnkuc2NhbGUpXHJcbiAgICAgICAgLmF0dHIoXCJyXCIsIGF4ZXMuc2l6ZS5zY2FsZSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICAvLyB3aGVuIGZpbmlzaGVkIGRyYXdpbmcgZ3JhcGg7IGFkZCBldmVudCBoYW5kbGVycyBcclxuICBkaXNwYXRjaC5vbihcInJlYWR5XCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gYWRkIGhvdmVyIGV2ZW50cyB0byB0aGUgbGluZXMgYW5kIHBvaW50c1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcclxuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xyXG4gICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSkub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XHJcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcclxuICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSkub24oXCJjbGlja1wiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XHJcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcclxuICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIExvY2FsIGV2ZW50IGhhbmRsZXJzXHJcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICBpZiAodmFyaWFibGUpIHtcclxuICAgICAgdmFyIGNsYXNzZXMgPSBheGVzLmNvbG91ci5zY2FsZShcIlwiICsgdmFsdWUpO1xyXG4gICAgICB2YXIgcmVnZXhwID0gL1xcYmNvbG91cihbMC05XSspXFxiLztcclxuICAgICAgdmFyIGNvbG91ciA9IHJlZ2V4cC5leGVjKGNsYXNzZXMpWzBdO1xyXG4gICAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZChcImNvbG91cmxvd1wiLCB0cnVlKTtcclxuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuXCIgKyBjb2xvdXIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiB0cnVlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuYXR0cihcInkxXCIsIGF4ZXMueS5zY2FsZShkKSkuYXR0cihcInkyXCIsIGF4ZXMueS5zY2FsZShkKSlcclxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5hdHRyKFwieDFcIiwgYXhlcy54LnNjYWxlKGQpKS5hdHRyKFwieDJcIiwgYXhlcy54LnNjYWxlKGQpKVxyXG4gICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKTtcclxuICB9KTtcclxuICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiBmYWxzZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICB9KTtcclxuXHJcbiAgLy8gVG9vbHRpcFxyXG4gIC8vIHdoZW4gZDMudGlwIGlzIGxvYWRlZFxyXG4gIGlmIChkMy50aXAgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgdmFyIHRpcCA9IGQzLnRpcCgpLmRpcmVjdGlvbihcInNlXCIpLmF0dHIoJ2NsYXNzJywgJ3RpcCB0aXAtYnViYmxlJykuaHRtbChmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHsgXHJcbiAgICAgIHZhciBzY2hlbWEgPSBncmFwaC5zY2hlbWEoKTtcclxuICAgICAgdmFyIGZvcm1hdCA9IHZhbHVlX2Zvcm1hdHRlcihzY2hlbWEpO1xyXG4gICAgICB2YXIgc3RyID0gJyc7XHJcbiAgICAgIGZvciAodmFyIGkgaW4gc2NoZW1hLmZpZWxkcykge1xyXG4gICAgICAgIHZhciBmaWVsZCA9IHNjaGVtYS5maWVsZHNbaV07XHJcbiAgICAgICAgc3RyICs9IGZpZWxkLnRpdGxlICsgJzogJyArIGZvcm1hdChkLCBmaWVsZC5uYW1lKSArICc8L2JyPic7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJyZWFkeS50aXBcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuY2FsbCh0aXApO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcIm1vdXNlb3Zlci50aXBcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICAgIHRpcC5zaG93KHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwibW91c2VvdXQudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgICB0aXAuaGlkZSh2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgcmV0dXJuIGdyYXBoO1xyXG59XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9ncmFwaF9saW5lKCkge1xyXG5cclxuICB2YXIgYXhlcyA9IHtcclxuICAgICd4JyA6IGdycGhfYXhpc19zd2l0Y2goW2dycGhfYXhpc19saW5lYXIodHJ1ZSksIGdycGhfYXhpc19wZXJpb2QoKV0pLFxyXG4gICAgJ3knIDogZ3JwaF9heGlzX2xpbmVhcihmYWxzZSksXHJcbiAgICAnY29sb3VyJyA6IGdycGhfYXhpc19jb2xvdXIoKSxcclxuICAgICdjb2x1bW4nIDogZ3JwaF9heGlzX3NwbGl0KCksXHJcbiAgICAncm93JyA6IGdycGhfYXhpc19zcGxpdCgpXHJcbiAgfTtcclxuICBheGVzLngucmVxdWlyZWQgPSB0cnVlO1xyXG4gIGF4ZXMueS5yZXF1aXJlZCA9IHRydWU7XHJcbiAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2goXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcInBvaW50b3ZlclwiLCBcInBvaW50b3V0XCIsXHJcbiAgICBcImNsaWNrXCIsIFwicmVhZHlcIik7XHJcblxyXG4gIHZhciBncmFwaCA9IGdycGhfZ2VuZXJpY19ncmFwaChheGVzLCBkaXNwYXRjaCwgXCJsaW5lXCIsIGZ1bmN0aW9uKGcsIGRhdGEpIHtcclxuICAgIGZ1bmN0aW9uIG5lc3RfY29sb3VyKGQpIHtcclxuICAgICAgcmV0dXJuIGF4ZXMuY29sb3VyLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sb3VyLnZhcmlhYmxlKCldIDogMTtcclxuICAgIH1cclxuICAgIHZhciBkID0gZDMubmVzdCgpLmtleShuZXN0X2NvbG91cikuZW50cmllcyhkYXRhKTtcclxuICAgIC8vIGRyYXcgbGluZXMgXHJcbiAgICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKCkueChheGVzLnguc2NhbGUpLnkoYXhlcy55LnNjYWxlKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZC5sZW5ndGg7ICsraSkge1xyXG4gICAgICBnLmFwcGVuZChcInBhdGhcIikuYXR0cihcImRcIiwgbGluZShkW2ldLnZhbHVlcykpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBheGVzLmNvbG91ci5zY2FsZShkW2ldLmtleSkpXHJcbiAgICAgICAgLmRhdHVtKGRbaV0pO1xyXG4gICAgfVxyXG4gICAgLy8gZHJhdyBwb2ludHMgXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgZC5sZW5ndGg7ICsraSkge1xyXG4gICAgICB2YXIgY2xzID0gXCJjaXJjbGVcIiArIGk7XHJcbiAgICAgIGcuc2VsZWN0QWxsKFwiY2lyY2xlLmNpcmNsZVwiICsgaSkuZGF0YShkW2ldLnZhbHVlcykuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY2lyY2xlXCIgKyBpICsgXCIgXCIgKyBheGVzLmNvbG91ci5zY2FsZShkW2ldLmtleSkpXHJcbiAgICAgICAgLmF0dHIoXCJjeFwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJjeVwiLCBheGVzLnkuc2NhbGUpXHJcbiAgICAgICAgLmF0dHIoXCJyXCIsIHNldHRpbmdzKCdwb2ludF9zaXplJykpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyB3aGVuIGZpbmlzaGVkIGRyYXdpbmcgZ3JhcGg7IGFkZCBldmVudCBoYW5kbGVycyBcclxuICBkaXNwYXRjaC5vbihcInJlYWR5XCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gYWRkIGhvdmVyIGV2ZW50cyB0byB0aGUgbGluZXMgYW5kIHBvaW50c1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcclxuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xyXG4gICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgICBpZiAoIWQua2V5KSBkaXNwYXRjaC5wb2ludG92ZXIuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSkub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XHJcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcclxuICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgICBpZiAoIWQua2V5KSBkaXNwYXRjaC5wb2ludG91dC5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcclxuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xyXG4gICAgICBkaXNwYXRjaC5jbGljay5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuICAvLyBMb2NhbCBldmVudCBoYW5kbGVyc1xyXG4gIC8vIEhpZ2hsaWdodGluZyBvZiBzZWxlY3RlZCBsaW5lXHJcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICBpZiAodmFyaWFibGUpIHtcclxuICAgICAgdmFyIGNsYXNzZXMgPSBheGVzLmNvbG91ci5zY2FsZShcIlwiICsgdmFsdWUpO1xyXG4gICAgICB2YXIgcmVnZXhwID0gL1xcYmNvbG91cihbMC05XSspXFxiLztcclxuICAgICAgdmFyIGNvbG91ciA9IHJlZ2V4cC5leGVjKGNsYXNzZXMpWzBdO1xyXG4gICAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZChcImNvbG91cmxvd1wiLCB0cnVlKTtcclxuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuXCIgKyBjb2xvdXIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiB0cnVlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IGZhbHNlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xyXG4gIH0pO1xyXG4gIC8vIFNob3cgY3Jvc3NoYWlycyB3aGVuIGhvdmVyaW5nIG92ZXIgYSBwb2ludFxyXG4gIGRpc3BhdGNoLm9uKFwicG9pbnRvdmVyXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuYXR0cihcInkxXCIsIGF4ZXMueS5zY2FsZShkKSkuYXR0cihcInkyXCIsIGF4ZXMueS5zY2FsZShkKSlcclxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5hdHRyKFwieDFcIiwgYXhlcy54LnNjYWxlKGQpKS5hdHRyKFwieDJcIiwgYXhlcy54LnNjYWxlKGQpKVxyXG4gICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKTtcclxuICB9KTtcclxuICBkaXNwYXRjaC5vbihcInBvaW50b3V0XCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBUb29sdGlwXHJcbiAgLy8gd2hlbiBkMy50aXAgaXMgbG9hZGVkXHJcbiAgaWYgKGQzLnRpcCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICB2YXIgdGlwID0gZDMudGlwKCkuZGlyZWN0aW9uKFwic2VcIikuYXR0cignY2xhc3MnLCAndGlwIHRpcC1saW5lJykuaHRtbChmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHsgXHJcbiAgICAgIHZhciBzY2hlbWEgPSBncmFwaC5zY2hlbWEoKTtcclxuICAgICAgdmFyIGZvcm1hdCA9IHZhbHVlX2Zvcm1hdHRlcihzY2hlbWEpO1xyXG4gICAgICB2YXIgc3RyID0gJyc7XHJcbiAgICAgIGZvciAodmFyIGkgaW4gc2NoZW1hLmZpZWxkcykge1xyXG4gICAgICAgIHZhciBmaWVsZCA9IHNjaGVtYS5maWVsZHNbaV07XHJcbiAgICAgICAgc3RyICs9IGZpZWxkLnRpdGxlICsgJzogJyArIGZvcm1hdChkLGZpZWxkLm5hbWUpICsgJzwvYnI+JztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc3RyO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcInJlYWR5LnRpcFwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jYWxsKHRpcCk7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwicG9pbnRvdmVyLnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgICAgdGlwLnNob3codmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJwb2ludG91dC50aXBcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICAgIHRpcC5oaWRlKHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBncmFwaDtcclxufVxyXG5cclxuIiwiXHJcblxyXG5mdW5jdGlvbiBncnBoX2dyYXBoX21hcCgpIHtcclxuXHJcbiAgdmFyIGF4ZXMgPSB7XHJcbiAgICAncmVnaW9uJyA6IGdycGhfYXhpc19yZWdpb24oKSxcclxuICAgICdjb2xvdXInIDogZ3JwaF9heGlzX2NobG9yb3BsZXRoKCksXHJcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxyXG4gICAgJ3JvdycgOiBncnBoX2F4aXNfc3BsaXQoKVxyXG4gIH07XHJcbiAgYXhlcy5yZWdpb24ucmVxdWlyZWQgPSB0cnVlO1xyXG4gIGF4ZXMuY29sb3VyLnJlcXVpcmVkID0gdHJ1ZTtcclxuICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaChcInJlYWR5XCIsIFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJjbGlja1wiKTtcclxuXHJcbiAgdmFyIGR1bW15XyA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwiZHVtbXkgZ3JhcGggZ3JhcGgtbWFwXCIpXHJcbiAgICAuYXR0cihcIndpZHRoXCIsIDApLmF0dHIoXCJoZWlnaHRcIiwgMClcclxuICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgdmFyIGxhYmVsX3NpemVfID0gZ3JwaF9sYWJlbF9zaXplKGR1bW15Xyk7XHJcblxyXG5cclxuICB2YXIgZ3JhcGggPSBncnBoX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBmdW5jdGlvbihnKSB7XHJcbiAgICBmdW5jdGlvbiBuZXN0X2NvbHVtbihkKSB7XHJcbiAgICAgIHJldHVybiBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gZFtheGVzLmNvbHVtbi52YXJpYWJsZSgpXSA6IDE7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBuZXN0X3JvdyhkKSB7XHJcbiAgICAgIHJldHVybiBheGVzLnJvdy52YXJpYWJsZSgpID8gZFtheGVzLnJvdy52YXJpYWJsZSgpXSA6IDE7XHJcbiAgICB9XHJcbiAgICAvLyBzZXR1cCBheGVzXHJcbiAgICBheGVzLnJlZ2lvbi5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcbiAgICBheGVzLmNvbG91ci5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcbiAgICBheGVzLmNvbHVtbi5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcbiAgICBheGVzLnJvdy5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XHJcblxyXG4gICAgLy8gZGV0ZXJtaW5lIG51bWJlciBvZiByb3dzIGFuZCBjb2x1bW5zXHJcbiAgICB2YXIgbmNvbCA9IGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBheGVzLmNvbHVtbi50aWNrcygpLmxlbmd0aCA6IDE7XHJcbiAgICB2YXIgbnJvdyA9IGF4ZXMucm93LnZhcmlhYmxlKCkgPyBheGVzLnJvdy50aWNrcygpLmxlbmd0aCA6IDE7XHJcbiAgICAvLyBzZXQgdGhlIHdpZHRoLCBoZWlnaHQgZW5kIGRvbWFpbiBvZiB0aGUgeC0gYW5kIHktYXhlc1xyXG4gICAgdmFyIGxhYmVsX2hlaWdodCA9IGxhYmVsX3NpemVfLmhlaWdodChcInZhcmlhYmxlXCIpICsgc2V0dGluZ3MoJ2xhYmVsX3BhZGRpbmcnKTtcclxuICAgIHZhciByb3dsYWJlbF93aWR0aCA9IGF4ZXMucm93LnZhcmlhYmxlKCkgPyAzKmxhYmVsX2hlaWdodCA6IDA7XHJcbiAgICB2YXIgY29sdW1ubGFiZWxfaGVpZ2h0ID0gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IDMqbGFiZWxfaGVpZ2h0IDogMDtcclxuICAgIHZhciB3ID0gKGdyYXBoLndpZHRoKCkgLSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMV0gLSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbM10gLSBcclxuICAgICAgcm93bGFiZWxfd2lkdGggLSAobmNvbC0xKSpzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKSkvbmNvbDtcclxuICAgIHZhciBoID0gKGdyYXBoLmhlaWdodCgpIC0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzBdIC0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzJdIC0gXHJcbiAgICAgIGNvbHVtbmxhYmVsX2hlaWdodCAtIChucm93LTEpKnNldHRpbmdzKFwic2VwXCIsIFwibWFwXCIpKS9ucm93O1xyXG4gICAgdmFyIGwgPSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMV07XHJcbiAgICB2YXIgdCAgPSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMl07XHJcbiAgICBheGVzLnJlZ2lvbi53aWR0aCh3KS5oZWlnaHQoaCk7XHJcbiAgICAvLyBjcmVhdGUgZ3JvdXAgY29udGFpbmluZyBjb21wbGV0ZSBncmFwaFxyXG4gICAgZyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJncmFwaCBncmFwaC1tYXBcIik7XHJcbiAgICAvLyBkcmF3IGxhYmVsc1xyXG4gICAgdmFyIHljZW50ZXIgPSB0ICsgMC41KihncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMF0gLSBzZXR0aW5ncygncGFkZGluZycpWzJdIC0gXHJcbiAgICAgICAgbGFiZWxfaGVpZ2h0IC0gY29sdW1ubGFiZWxfaGVpZ2h0KSArIGNvbHVtbmxhYmVsX2hlaWdodDtcclxuICAgIHZhciB4Y2VudGVyID0gbCArIDAuNSooZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gXHJcbiAgICAgICAgbGFiZWxfaGVpZ2h0IC0gcm93bGFiZWxfd2lkdGgpO1xyXG4gICAgaWYgKGF4ZXMucm93LnZhcmlhYmxlKCkpIHtcclxuICAgICAgdmFyIHhyb3cgPSBncmFwaC53aWR0aCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVszXSAtIGxhYmVsX2hlaWdodDtcclxuICAgICAgdmFyIHZzY2hlbWFyb3cgPSB2YXJpYWJsZV9zY2hlbWEoYXhlcy5yb3cudmFyaWFibGUoKSwgc2NoZW1hKTtcclxuICAgICAgdmFyIHJvd2xhYmVsID0gdnNjaGVtYXJvdy50aXRsZTtcclxuICAgICAgZy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsIGxhYmVsLXlcIilcclxuICAgICAgICAuYXR0cihcInhcIiwgeHJvdykuYXR0cihcInlcIiwgeWNlbnRlcilcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLnRleHQocm93bGFiZWwpXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoOTAgXCIgKyB4cm93ICsgXCIgXCIgKyB5Y2VudGVyICsgXCIpXCIpO1xyXG4gICAgfVxyXG4gICAgaWYgKGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkpIHtcclxuICAgICAgdmFyIHZzY2hlbWFjb2x1bW4gPSB2YXJpYWJsZV9zY2hlbWEoYXhlcy5jb2x1bW4udmFyaWFibGUoKSwgc2NoZW1hKTtcclxuICAgICAgdmFyIGNvbHVtbmxhYmVsID0gdnNjaGVtYWNvbHVtbi50aXRsZTtcclxuICAgICAgZy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsIGxhYmVsLXlcIilcclxuICAgICAgICAuYXR0cihcInhcIiwgeGNlbnRlcikuYXR0cihcInlcIiwgc2V0dGluZ3MoXCJwYWRkaW5nXCIpWzJdKS5hdHRyKFwiZHlcIiwgXCIwLjcxZW1cIilcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLnRleHQoY29sdW1ubGFiZWwpO1xyXG4gICAgfVxyXG4gICAgLy8gZHJhdyBncmFwaHNcclxuICAgIHdhaXRfZm9yKGF4ZXMucmVnaW9uLm1hcF9sb2FkZWQsIGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2x1bW4pLmtleShuZXN0X3JvdykuZW50cmllcyhncmFwaC5kYXRhKCkpO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICB2YXIgZGogPSBkW2ldLnZhbHVlcztcclxuICAgICAgICB2YXIgdCAgPSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMl0gKyBjb2x1bW5sYWJlbF9oZWlnaHQ7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkai5sZW5ndGg7ICsraikge1xyXG4gICAgICAgICAgLy8gZHJhdyByb3cgbGFiZWxzXHJcbiAgICAgICAgICBpZiAoaSA9PSAoZC5sZW5ndGgtMSkgJiYgYXhlcy5yb3cudmFyaWFibGUoKSkge1xyXG4gICAgICAgICAgICB2YXIgcm93dGljayA9IGF4ZXMucm93LnRpY2tzKClbal07XHJcbiAgICAgICAgICAgIHZhciBncm93ID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXMgYXhpcy1yb3dcIilcclxuICAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIChsICsgdykgKyBcIixcIiArIHQgKyBcIilcIik7XHJcbiAgICAgICAgICAgIGdyb3cuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBsYWJlbF9oZWlnaHQgKyAyKnNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGgpO1xyXG4gICAgICAgICAgICBncm93LmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGlja2xhYmVsXCIpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIDApLmF0dHIoXCJ5XCIsIGgvMilcclxuICAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSg5MCBcIiArIFxyXG4gICAgICAgICAgICAgICAgKGxhYmVsX2hlaWdodCAtIHNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKSArIFwiIFwiICsgaC8yICsgXCIpXCIpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS5hdHRyKFwiZHlcIiwgXCIwLjM1ZW1cIilcclxuICAgICAgICAgICAgICAudGV4dChyb3d0aWNrKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGRyYXcgY29sdW1uIGxhYmVsc1xyXG4gICAgICAgICAgaWYgKGogPT09IDAgJiYgYXhlcy5jb2x1bW4udmFyaWFibGUoKSkge1xyXG4gICAgICAgICAgICB2YXIgY29sdW1udGljayA9IGF4ZXMuY29sdW1uLnRpY2tzKClbaV07XHJcbiAgICAgICAgICAgIHZhciBjb2x0aWNraCA9IGxhYmVsX2hlaWdodCArIDIqc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIik7XHJcbiAgICAgICAgICAgIHZhciBnY29sdW1uID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXMgYXhpcy1jb2x1bW5cIilcclxuICAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGwgKyBcIixcIiArICh0IC0gY29sdGlja2gpICsgXCIpXCIpO1xyXG4gICAgICAgICAgICBnY29sdW1uLmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgdylcclxuICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBsYWJlbF9oZWlnaHQgKyAyKnNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKTtcclxuICAgICAgICAgICAgZ2NvbHVtbi5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tsYWJlbFwiKVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwieFwiLCB3LzIpLmF0dHIoXCJ5XCIsIHNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikuYXR0cihcImR5XCIsIFwiMC43MWVtXCIpXHJcbiAgICAgICAgICAgICAgLnRleHQoY29sdW1udGljayk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBkcmF3IGJveCBmb3IgZ3JhcGhcclxuICAgICAgICAgIHZhciBnciA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJtYXBcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyB0ICsgXCIpXCIpO1xyXG4gICAgICAgICAgZ3IuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgdykuYXR0cihcImhlaWdodFwiLCBoKTtcclxuICAgICAgICAgIC8vIGRyYXcgbWFwXHJcbiAgICAgICAgICBnci5zZWxlY3RBbGwoXCJwYXRoXCIpLmRhdGEoZGpbal0udmFsdWVzKS5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJkXCIsIGF4ZXMucmVnaW9uLnNjYWxlKS5hdHRyKFwiY2xhc3NcIiwgYXhlcy5jb2xvdXIuc2NhbGUpO1xyXG4gICAgICAgICAgLy8gbmV4dCBsaW5lXHJcbiAgICAgICAgICB0ICs9IGggKyBzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbCArPSB3ICsgc2V0dGluZ3MoXCJzZXBcIiwgXCJtYXBcIik7XHJcbiAgICAgIH1cclxuICAgICAgLy8gYWRkIGV2ZW50cyB0byB0aGUgbGluZXNcclxuICAgICAgZy5zZWxlY3RBbGwoXCJwYXRoXCIpLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgICB2YXIgcmVnaW9uID0gZFtheGVzLnJlZ2lvbi52YXJpYWJsZSgpXTtcclxuICAgICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbChnLCBheGVzLnJlZ2lvbi52YXJpYWJsZSgpLCByZWdpb24sIGQpO1xyXG4gICAgICB9KS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgICB2YXIgcmVnaW9uID0gZFtheGVzLnJlZ2lvbi52YXJpYWJsZSgpXTtcclxuICAgICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKGcsIGF4ZXMucmVnaW9uLnZhcmlhYmxlKCksIHJlZ2lvbiwgZCk7XHJcbiAgICAgIH0pLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICAgIHZhciByZWdpb24gPSBkW2F4ZXMucmVnaW9uLnZhcmlhYmxlKCldO1xyXG4gICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwoZywgYXhlcy5yZWdpb24udmFyaWFibGUoKSwgcmVnaW9uLCBkKTtcclxuICAgICAgfSk7XHJcbiAgICAgIC8vIGZpbmlzaGVkIGRyYXdpbmcgY2FsbCByZWFkeSBldmVudFxyXG4gICAgICBkaXNwYXRjaC5yZWFkeS5jYWxsKGcpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG5cclxuICAvLyBMb2NhbCBldmVudCBoYW5kbGVyc1xyXG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdmVyLmdyYXBoXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCJwYXRoXCIpLmNsYXNzZWQoXCJjb2xvdXJsb3dcIiwgdHJ1ZSk7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcInBhdGhcIikuZmlsdGVyKGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIGRbdmFyaWFibGVdID09IHZhbHVlO1xyXG4gICAgfSkuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IHRydWUsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XHJcbiAgfSk7XHJcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW91dC5ncmFwaFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwicGF0aFwiKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogZmFsc2UsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XHJcbiAgfSk7XHJcbiAgXHJcbiAgLy8gdG9vbHRpcFxyXG4gIGlmIChkMy50aXAgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgdmFyIHRpcCA9IGQzLnRpcCgpLmRpcmVjdGlvbihcInNlXCIpLmF0dHIoJ2NsYXNzJywgJ3RpcCB0aXAtbWFwJykuaHRtbChmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHsgXHJcbiAgICAgIHZhciBzY2hlbWEgPSBncmFwaC5zY2hlbWEoKTtcclxuICAgICAgdmFyIGZvcm1hdCA9IHZhbHVlX2Zvcm1hdHRlcihzY2hlbWEpO1xyXG4gICAgICB2YXIgc3RyID0gJyc7XHJcbiAgICAgIGZvciAodmFyIGkgaW4gc2NoZW1hLmZpZWxkcykge1xyXG4gICAgICAgIHZhciBmaWVsZCA9IHNjaGVtYS5maWVsZHNbaV07XHJcbiAgICAgICAgc3RyICs9IGZpZWxkLnRpdGxlICsgJzogJyArIGZvcm1hdChkLCBmaWVsZC5uYW1lKSArICc8L2JyPic7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJyZWFkeS50aXBcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuY2FsbCh0aXApO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcIm1vdXNlb3Zlci50aXBcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICAgIHRpcC5zaG93KHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwibW91c2VvdXQudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgICB0aXAuaGlkZSh2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZ3JhcGg7XHJcbn1cclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2xhYmVsX3NpemUoZykge1xyXG5cclxuICAvLyBhIHN2ZyBvciBnIGVsZW1lbnQgdG8gd2hpY2ggIHdlIHdpbGwgYmUgYWRkaW5nIG91ciBsYWJlbCBpbiBvcmRlciB0b1xyXG4gIC8vIHJlcXVlc3QgaXQncyBzaXplXHJcbiAgdmFyIGdfID0gZztcclxuICAvLyBzdG9yZSBwcmV2aW91c2x5IGNhbGN1bGF0ZWQgdmFsdWVzOyBhcyB0aGUgc2l6ZSBvZiBjZXJ0YWluIGxhYmVscyBhcmUgXHJcbiAgLy8gcmVxdWVzdGVkIGFnYWluIGFuZCBhZ2FpbiB0aGlzIGdyZWF0bHkgZW5oYW5jZXMgcGVyZm9ybWFuY2VcclxuICB2YXIgc2l6ZXNfID0ge307XHJcblxyXG4gIGZ1bmN0aW9uIGxhYmVsX3NpemUobGFiZWwpIHtcclxuICAgIGlmIChzaXplc19bbGFiZWxdKSB7XHJcbiAgICAgIHJldHVybiBzaXplc19bbGFiZWxdO1xyXG4gICAgfVxyXG4gICAgaWYgKCFnXykgcmV0dXJuIFt1bmRlZmluZWQsIHVuZGVmaW5lZF07XHJcbiAgICB2YXIgdGV4dCA9IGdfLmFwcGVuZChcInRleHRcIikudGV4dChsYWJlbCk7XHJcbiAgICB2YXIgYmJveCA9IHRleHRbMF1bMF0uZ2V0QkJveCgpO1xyXG4gICAgdmFyIHNpemUgPSBbYmJveC53aWR0aCoxLjIsIGJib3guaGVpZ2h0KjAuNjVdOyAvLyBUT0RPIHdoeTsgYW5kIGlzIHRoaXMgYWx3YXlzIGNvcnJlY3RcclxuICAgIC8vdmFyIHNpemUgPSBob3Jpem9udGFsXyA/IHRleHRbMF1bMF0uZ2V0Q29tcHV0ZWRUZXh0TGVuZ3RoKCkgOlxyXG4gICAgICAvL3RleHRbMF1bMF0uZ2V0QkJveCgpLmhlaWdodDtcclxuICAgIHRleHQucmVtb3ZlKCk7XHJcbiAgICBzaXplc19bbGFiZWxdID0gc2l6ZTtcclxuICAgIHJldHVybiBzaXplO1xyXG4gIH1cclxuXHJcbiAgbGFiZWxfc2l6ZS5zdmcgPSBmdW5jdGlvbihnKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gZ187XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBnXyA9IGc7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGxhYmVsX3NpemUud2lkdGggPSBmdW5jdGlvbihsYWJlbCkge1xyXG4gICAgdmFyIHNpemUgPSBsYWJlbF9zaXplKGxhYmVsKTtcclxuICAgIHJldHVybiBzaXplWzBdO1xyXG4gIH07XHJcblxyXG4gIGxhYmVsX3NpemUuaGVpZ2h0ID0gZnVuY3Rpb24obGFiZWwpIHtcclxuICAgIHZhciBzaXplID0gbGFiZWxfc2l6ZShsYWJlbCk7XHJcbiAgICByZXR1cm4gc2l6ZVsxXTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gbGFiZWxfc2l6ZTtcclxufVxyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfY2F0ZWdvcmljYWwoKSB7XHJcblxyXG4gIHZhciBkb21haW47XHJcbiAgdmFyIHJhbmdlID0gWzAsIDFdO1xyXG5cclxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XHJcbiAgICB2YXIgaSA9IGRvbWFpbi5pbmRleE9mKHYpO1xyXG4gICAgaWYgKGkgPCAwKSByZXR1cm4ge2w6IHVuZGVmaW5lZCwgbTp1bmRlZmluZWQsIHU6dW5kZWZpbmVkfTtcclxuICAgIHZhciBidyA9IChyYW5nZVsxXSAtIHJhbmdlWzBdKSAvIGRvbWFpbi5sZW5ndGg7XHJcbiAgICB2YXIgbSA9IGJ3KihpICsgMC41KTtcclxuICAgIHZhciB3ID0gYncqKDEgLSBzZXR0aW5ncyhcImJhcl9wYWRkaW5nXCIpKSowLjU7XHJcbiAgICByZXR1cm4ge2w6bS13LCBtOm0sIHU6bSt3fTtcclxuICB9XHJcblxyXG4gIHNjYWxlLmwgPSBmdW5jdGlvbih2KSB7XHJcbiAgICByZXR1cm4gc2NhbGUodikubDtcclxuICB9O1xyXG5cclxuICBzY2FsZS5tID0gZnVuY3Rpb24odikge1xyXG4gICAgcmV0dXJuIHNjYWxlKHYpLm07XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUudSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIHJldHVybiBzY2FsZSh2KS51O1xyXG4gIH07XHJcblxyXG4gIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKGQpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBkb21haW47XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkb21haW4gPSBkO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHIpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiByYW5nZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJhbmdlID0gcjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBkb21haW47XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHNjYWxlO1xyXG59XHJcblxyXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XHJcbmdycGguc2NhbGUuY2F0ZWdvcmljYWwgPSBncnBoX3NjYWxlX2NhdGVnb3JpY2FsO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfY2hsb3JvcGxldGgoKSB7XHJcblxyXG4gIHZhciBkb21haW47XHJcbiAgdmFyIGJhc2VjbGFzcyA9IFwiY2hsb3JvXCI7XHJcbiAgdmFyIG5jb2xvdXJzICA9IDk7XHJcblxyXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcclxuICAgIGlmIChkb21haW4gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBhc3N1bWUgd2UgaGF2ZSBvbmx5IDEgY29sb3VyXHJcbiAgICAgIHJldHVybiBiYXNlY2xhc3MgKyBcIiBcIiArIGJhc2VjbGFzcyArIFwibjFcIiArIFwiIFwiICsgYmFzZWNsYXNzICsgMTtcclxuICAgIH1cclxuICAgIHZhciByYW5nZSAgPSBkb21haW5bMV0gLSBkb21haW5bMF07XHJcbiAgICB2YXIgdmFsICAgID0gTWF0aC5zcXJ0KCh2IC0gZG9tYWluWzBdKSowLjk5OTkpIC8gTWF0aC5zcXJ0KHJhbmdlKTtcclxuICAgIHZhciBjYXQgICAgPSBNYXRoLmZsb29yKHZhbCpuY29sb3Vycyk7XHJcbiAgICAvLyByZXR1cm5zIHNvbWV0aGluZyBsaWtlIFwiY2hsb3JvIGNobG9yb24xMCBjaGxvcm80XCJcclxuICAgIHJldHVybiBiYXNlY2xhc3MgKyBcIiBcIiArIGJhc2VjbGFzcyArIFwiblwiICsgbmNvbG91cnMgKyBcIiBcIiArIGJhc2VjbGFzcyArIChjYXQrMSk7XHJcbiAgfVxyXG5cclxuICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbihkKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gZG9tYWluO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZG9tYWluID0gZDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUucmFuZ2UgPSBmdW5jdGlvbihyKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gYmFzZWNsYXNzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYmFzZWNsYXNzID0gcjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzdGVwID0gKGRvbWFpblsxXSAtIGRvbWFpblswXSkvbmNvbG91cnM7XHJcbiAgICB2YXIgdCA9IGRvbWFpblswXTtcclxuICAgIHZhciB0aWNrcyA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbmNvbG91cnM7ICsraSkge1xyXG4gICAgICB0aWNrcy5wdXNoKHQpO1xyXG4gICAgICB0ICs9IHN0ZXA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGlja3M7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHNjYWxlO1xyXG59XHJcblxyXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XHJcbmdycGguc2NhbGUuY2hsb3JvcGxldGggPSBncnBoX3NjYWxlX2NobG9yb3BsZXRoKCk7XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9zY2FsZV9jb2xvdXIoKSB7XHJcblxyXG4gIHZhciBkb21haW47XHJcbiAgdmFyIHJhbmdlID0gXCJjb2xvdXJcIjtcclxuICB2YXIgbmNvbG91cnM7XHJcblxyXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcclxuICAgIGlmIChkb21haW4gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBhc3N1bWUgd2UgaGF2ZSBvbmx5IDEgY29sb3VyXHJcbiAgICAgIHJldHVybiByYW5nZSArIFwiIFwiICsgcmFuZ2UgKyBcIm4xXCIgKyBcIiBcIiArIHJhbmdlICsgMTtcclxuICAgIH1cclxuICAgIHZhciBpID0gZG9tYWluLmluZGV4T2Yodik7XHJcbiAgICAvLyByZXR1cm5zIHNvbWV0aGluZyBsaWtlIFwiY29sb3VyIGNvbG91cm4xMCBjb2xvdXI0XCJcclxuICAgIHJldHVybiByYW5nZSArIFwiIFwiICsgcmFuZ2UgKyBcIm5cIiArIG5jb2xvdXJzICsgXCIgXCIgKyByYW5nZSArIChpKzEpO1xyXG4gIH1cclxuXHJcbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGRvbWFpbjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRvbWFpbiA9IGQ7XHJcbiAgICAgIG5jb2xvdXJzID0gZC5sZW5ndGg7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHJhbmdlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmFuZ2UgPSByO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGRvbWFpbjtcclxuICB9O1xyXG5cclxuICByZXR1cm4gc2NhbGU7XHJcbn1cclxuXHJcbmlmIChncnBoLnNjYWxlID09PSB1bmRlZmluZWQpIGdycGguc2NhbGUgPSB7fTtcclxuZ3JwaC5zY2FsZS5jb2xvdXIgPSBncnBoX3NjYWxlX2NvbG91cigpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfbGluZWFyKCkge1xyXG5cclxuICB2YXIgbHNjYWxlID0gZDMuc2NhbGUubGluZWFyKCk7XHJcbiAgdmFyIGxhYmVsX3NpemVfID0gMjA7XHJcbiAgdmFyIHBhZGRpbmdfID0gNTtcclxuICB2YXIgbnRpY2tzXyA9IDEwO1xyXG4gIHZhciB0aWNrc187XHJcbiAgdmFyIG5kZWNfO1xyXG4gIHZhciBpbnNpZGVfID0gdHJ1ZTtcclxuXHJcbiAgZnVuY3Rpb24gc2NhbGUodikge1xyXG4gICAgcmV0dXJuIGxzY2FsZSh2KTtcclxuICB9XHJcblxyXG4gIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKGQpIHtcclxuICAgIGQgPSBsc2NhbGUuZG9tYWluKGQpO1xyXG4gICAgbmRlY18gPSB1bmRlZmluZWQ7XHJcbiAgICB0aWNrc18gPSB1bmRlZmluZWQ7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gZDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xyXG4gICAgciA9IGxzY2FsZS5yYW5nZShyKTtcclxuICAgIG5kZWNfID0gdW5kZWZpbmVkO1xyXG4gICAgdGlja3NfID0gdW5kZWZpbmVkO1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS5sYWJlbF9zaXplID0gZnVuY3Rpb24obGFiZWxfc2l6ZSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGxhYmVsX3NpemVfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbGFiZWxfc2l6ZV8gPSBsYWJlbF9zaXplO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBmdW5jdGlvbiBsc2l6ZShsYWJlbCkge1xyXG4gICAgdmFyIHNpemUgPSB0eXBlb2YobGFiZWxfc2l6ZV8pID09IFwiZnVuY3Rpb25cIiA/IGxhYmVsX3NpemVfKGxhYmVsKSA6IGxhYmVsX3NpemVfO1xyXG4gICAgc2l6ZSArPSBwYWRkaW5nXztcclxuICAgIHJldHVybiBzaXplO1xyXG4gIH1cclxuXHJcbiAgc2NhbGUubnRpY2tzID0gZnVuY3Rpb24obikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIG50aWNrc187XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBudGlja3NfID0gbjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUuaW5zaWRlID0gZnVuY3Rpb24oaSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGluc2lkZV87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpbnNpZGVfID0gaSA/IHRydWUgOiBmYWxzZTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUubmljZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHIgPSBsc2NhbGUucmFuZ2UoKTtcclxuICAgIHZhciBkID0gbHNjYWxlLmRvbWFpbigpO1xyXG4gICAgdmFyIGwgPSBNYXRoLmFicyhyWzFdIC0gclswXSk7XHJcbiAgICB2YXIgdyA9IHdpbGtpbnNvbl9paShkWzBdLCBkWzFdLCBudGlja3NfLCBsc2l6ZSwgbCk7XHJcbiAgICBpZiAoaW5zaWRlXykge1xyXG4gICAgICB2YXIgdzEgPSBsc2l6ZSh3LmxhYmVsc1swXSk7XHJcbiAgICAgIHZhciB3MiA9IGxzaXplKHcubGFiZWxzW3cubGFiZWxzLmxlbmd0aC0xXSk7XHJcbiAgICAgIHZhciBwYWQgPSB3MS8yICsgdzIvMjtcclxuICAgICAgdyA9IHdpbGtpbnNvbl9paShkWzBdLCBkWzFdLCBudGlja3NfLCBsc2l6ZSwgbC1wYWQpO1xyXG4gICAgICBpZiAoclswXSA8IHJbMV0pIHtcclxuICAgICAgICBsc2NhbGUucmFuZ2UoW3JbMF0rdzEvMiwgclsxXS13Mi8yXSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbHNjYWxlLnJhbmdlKFtyWzBdLXcxLzIsIHJbMV0rdzIvMl0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBkb21haW4gPSBbdy5sbWluLCB3LmxtYXhdO1xyXG4gICAgbHNjYWxlLmRvbWFpbihbdy5sbWluLCB3LmxtYXhdKTtcclxuICAgIHRpY2tzXyA9IHcubGFiZWxzO1xyXG4gICAgbmRlY18gPSB3Lm5kZWM7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKHRpY2tzXyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gbHNjYWxlLnRpY2tzKG50aWNrc18pO1xyXG4gICAgcmV0dXJuIHRpY2tzXy5tYXAoZnVuY3Rpb24odCkgeyByZXR1cm4gZm9ybWF0X251bWJlcih0LCBcIlwiLCBuZGVjXyk7fSk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHNjYWxlO1xyXG59XHJcblxyXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XHJcbmdycGguc2NhbGUubGluZWFyID0gZ3JwaF9zY2FsZV9saW5lYXIoKTtcclxuXHJcbiIsImZ1bmN0aW9uIGdycGhfc2NhbGVfcGVyaW9kKCkge1xyXG5cclxuICB2YXIgdGltZV9zY2FsZSA9IGQzLnRpbWUuc2NhbGUoKTtcclxuICB2YXIgeWVhcnNfO1xyXG4gIHZhciBoYXNfbW9udGhfID0gZmFsc2U7XHJcbiAgdmFyIGhhc19xdWFydGVyXyA9IGZhbHNlO1xyXG5cclxuICBmdW5jdGlvbiBzY2FsZSh2YWwpIHtcclxuICAgIGlmICgodmFsIGluc3RhbmNlb2YgRGF0ZSkgfHwgbW9tZW50LmlzTW9tZW50KHZhbCkpIHtcclxuICAgICAgcmV0dXJuIHRpbWVfc2NhbGUodmFsKTtcclxuICAgIH0gZWxzZSBpZiAodmFsICYmIHZhbC5kYXRlICYmIHZhbC5wZXJpb2QpIHtcclxuICAgICAgdGltZV9zY2FsZSh2YWwuZGF0ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YWwgPSBcIlwiICsgdmFsO1xyXG4gICAgICByZXR1cm4gdGltZV9zY2FsZShkYXRlX3BlcmlvZCh2YWwpLmRhdGUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2NhbGUuaGFzX21vbnRoID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gaGFzX21vbnRoXztcclxuICB9O1xyXG5cclxuICBzY2FsZS5oYXNfcXVhcnRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGhhc19xdWFydGVyXztcclxuICB9O1xyXG5cclxuICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbihkb21haW4pIHtcclxuICAgIHZhciBwZXJpb2RzID0gZG9tYWluLm1hcChkYXRlX3BlcmlvZCk7XHJcbiAgICAvLyBkZXRlcm1pbmUgd2hpY2ggeWVhcnMgYXJlIGluIGRvbWFpbjsgYXhpcyB3aWwgYWx3YXlzIGRyYXcgY29tcGxldGVcclxuICAgIC8vIHllYXJzXHJcbiAgICB5ZWFyc18gPSBkMy5leHRlbnQocGVyaW9kcywgZnVuY3Rpb24oZCkge1xyXG4gICAgICByZXR1cm4gZC5wZXJpb2Quc3RhcnQueWVhcigpO1xyXG4gICAgfSk7XHJcbiAgICAvLyBzZXQgZG9tYWluXHJcbiAgICB0aW1lX3NjYWxlLmRvbWFpbihbbmV3IERhdGUoeWVhcnNfWzBdICsgXCItMDEtMDFcIiksIFxyXG4gICAgICAgIG5ldyBEYXRlKCh5ZWFyc19bMV0rMSkgKyBcIi0wMS0wMVwiKV0pO1xyXG4gICAgLy8gZGV0ZXJtaW5lIHdoaWNoIHN1YnVuaXRzIG9mIHllYXJzIHNob3VsZCBiZSBkcmF3blxyXG4gICAgaGFzX21vbnRoXyA9IHBlcmlvZHMucmVkdWNlKGZ1bmN0aW9uKHAsIGQpIHtcclxuICAgICAgcmV0dXJuIHAgfHwgZC50eXBlID09IFwibW9udGhcIjtcclxuICAgIH0sIGZhbHNlKTtcclxuICAgIGhhc19xdWFydGVyXyA9IHBlcmlvZHMucmVkdWNlKGZ1bmN0aW9uKHAsIGQpIHtcclxuICAgICAgcmV0dXJuIHAgfHwgZC50eXBlID09IFwicXVhcnRlclwiO1xyXG4gICAgfSwgZmFsc2UpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUucmFuZ2UgPSBmdW5jdGlvbihyYW5nZSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB0aW1lX3NjYWxlLnJhbmdlKCk7XHJcbiAgICB0aW1lX3NjYWxlLnJhbmdlKHJhbmdlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIHNjYWxlLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgdGlja3MgPSBbXTtcclxuICAgIGZvciAodmFyIHllYXIgPSB5ZWFyc19bMF07IHllYXIgPD0geWVhcnNfWzFdOyB5ZWFyKyspIHtcclxuICAgICAgdmFyIHRpY2sgPSBkYXRlX3BlcmlvZCh5ZWFyICsgXCItMDEtMDEvUDFZXCIpO1xyXG4gICAgICB0aWNrLmxhc3QgPSB5ZWFyID09IHllYXJzX1sxXTtcclxuICAgICAgdGljay5sYWJlbCA9IHllYXI7XHJcbiAgICAgIHRpY2tzLnB1c2godGljayk7XHJcblxyXG4gICAgICBpZiAoc2NhbGUuaGFzX3F1YXJ0ZXIoKSkge1xyXG4gICAgICAgIGZvciAodmFyIHEgPSAwOyBxIDwgNDsgcSsrKSB7XHJcbiAgICAgICAgICB0aWNrID0gZGF0ZV9wZXJpb2QoeWVhciArIFwiLVwiICsgemVyb19wYWQocSozKzEsIDIpICsgXCItMDEvUDNNXCIpO1xyXG4gICAgICAgICAgdGljay5sYXN0ID0gcSA9PSAzO1xyXG4gICAgICAgICAgdGljay5sYWJlbCA9IHErMTtcclxuICAgICAgICAgIHRpY2tzLnB1c2godGljayk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IFxyXG4gICAgICBpZiAoc2NhbGUuaGFzX21vbnRoKCkpIHtcclxuICAgICAgICBmb3IgKHZhciBtID0gMDsgbSA8IDEyOyBtKyspIHtcclxuICAgICAgICAgIHRpY2sgPSBkYXRlX3BlcmlvZCh5ZWFyICsgXCItXCIgKyB6ZXJvX3BhZChtKzEsMikgKyBcIi0wMS9QMU1cIik7XHJcbiAgICAgICAgICB0aWNrLmxhc3QgPSAoc2NhbGUuaGFzX3F1YXJ0ZXIoKSAmJiAoKG0rMSkgJSAzKSA9PT0gMCkgfHwgbSA9PSAxMTtcclxuICAgICAgICAgIHRpY2subGFiZWwgPSBtKzE7XHJcbiAgICAgICAgICB0aWNrcy5wdXNoKHRpY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBcclxuICAgIH1cclxuICAgIHJldHVybiB0aWNrcztcclxuICB9O1xyXG5cclxuICByZXR1cm4gc2NhbGU7XHJcbn1cclxuXHJcblxyXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XHJcbmdycGguc2NhbGUucGVyaW9kID0gZ3JwaF9zY2FsZV9wZXJpb2QoKTtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX3NjYWxlX3NpemUoKSB7XHJcbiAgXHJcbiAgdmFyIG1heDtcclxuICB2YXIgZG9tYWluO1xyXG5cclxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XHJcbiAgICBpZiAoZG9tYWluID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHNldHRpbmdzKFwiZGVmYXVsdF9idWJibGVcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgbSA9IG1heCA9PT0gdW5kZWZpbmVkID8gc2V0dGluZ3MoXCJtYXhfYnViYmxlXCIpIDogbWF4O1xyXG4gICAgICByZXR1cm4gbSAqIE1hdGguc3FydCh2KS9NYXRoLnNxcnQoZG9tYWluWzFdKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKGQpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBkb21haW47XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkb21haW4gPSBkMy5leHRlbnQoZCk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIG1heCA9PT0gdW5kZWZpbmVkID8gc2V0dGluZ3MoXCJtYXhfYnViYmxlXCIpIDogbWF4O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWF4ID0gZDMubWF4KHIpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9O1xyXG5cclxuICByZXR1cm4gc2NhbGU7XHJcbn1cclxuXHJcbmlmIChncnBoLnNjYWxlID09PSB1bmRlZmluZWQpIGdycGguc2NhbGUgPSB7fTtcclxuZ3JwaC5zY2FsZS5zaXplID0gZ3JwaF9zY2FsZV9zaXplKCk7XHJcblxyXG4iLCJcclxuXHJcbnZhciBzZXR0aW5ncyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzID0ge1xyXG4gICAgJ2RlZmF1bHQnIDoge1xyXG4gICAgICAncGFkZGluZycgOiBbMiwgMiwgMiwgMl0sXHJcbiAgICAgICdsYWJlbF9wYWRkaW5nJyA6IDQsXHJcbiAgICAgICdzZXAnIDogOCxcclxuICAgICAgJ3BvaW50X3NpemUnIDogNCxcclxuICAgICAgJ21heF9idWJibGUnIDogMjAsXHJcbiAgICAgICdkZWZhdWx0X2J1YmJsZScgOiA1LFxyXG4gICAgICAnYmFyX3BhZGRpbmcnIDogMC40LFxyXG4gICAgICAndGlja19sZW5ndGgnIDogNSxcclxuICAgICAgJ3RpY2tfcGFkZGluZycgOiAyXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZnVuY3Rpb24gZ2V0KHNldHRpbmcsIHR5cGUpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzZXR0aW5ncztcclxuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICBpZiAoc1t0eXBlXSAhPT0gdW5kZWZpbmVkICYmIHNbdHlwZV1bc2V0dGluZ10gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBzW3R5cGVdW3NldHRpbmddO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBzLmRlZmF1bHRbc2V0dGluZ107XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzLmRlZmF1bHRbc2V0dGluZ107XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXQuc2V0ID0gZnVuY3Rpb24oc2V0dGluZywgYSwgYikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgcy5kZWZhdWx0W3NldHRpbmddID0gYTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgaWYgKHNbYV0gPT09IHVuZGVmaW5lZCkgc1thXSA9IHt9O1xyXG4gICAgICBzW2FdW3NldHRpbmddID0gYjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZWVkIGF0IGxlYXQgdHdvIGFyZ3VtZW50cy5cIik7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGdldDtcclxufSgpO1xyXG5cclxuZ3JwaC5zZXR0aW5ncyA9IHNldHRpbmdzO1xyXG4iLCJcclxuLy8gQ29udmVydCBhIG51bWJlciB0byBzdHJpbmcgcGFkZGluZyBpdCB3aXRoIHplcm9zIHVudGlsIHRoZSBudW1iZXIgb2YgXHJcbi8vIGNoYXJhY3RlcnMgYmVmb3JlIHRoZSBkZWNpbWFsIHN5bWJvbCBlcXVhbHMgbGVuZ3RoIChub3QgaW5jbHVkaW5nIHNpZ24pXHJcbmZ1bmN0aW9uIHplcm9fcGFkKG51bSwgbGVuZ3RoKSB7XHJcbiAgdmFyIG4gPSBNYXRoLmFicyhudW0pO1xyXG4gIHZhciBuemVyb3MgPSBNYXRoLm1heCgwLCBsZW5ndGggLSBNYXRoLmZsb29yKG4pLnRvU3RyaW5nKCkubGVuZ3RoICk7XHJcbiAgdmFyIHBhZGRpbmcgPSBNYXRoLnBvdygxMCwgbnplcm9zKS50b1N0cmluZygpLnN1YnN0cigxKTtcclxuICBpZiggbnVtIDwgMCApIHtcclxuICAgIHBhZGRpbmcgPSAnLScgKyBwYWRkaW5nO1xyXG4gIH1cclxuICByZXR1cm4gcGFkZGluZyArIG47XHJcbn1cclxuXHJcblxyXG4vLyBGb3JtYXQgYSBudW1lcmljIHZhbHVlOlxyXG4vLyAtIE1ha2Ugc3VyZSBpdCBpcyByb3VuZGVkIHRvIHRoZSBjb3JyZWN0IG51bWJlciBvZiBkZWNpbWFscyAobmRlYylcclxuLy8gLSBVc2UgdGhlIGNvcnJlY3QgZGVjaW1hbCBzZXBhcmF0b3IgKGRlYylcclxuLy8gLSBBZGQgYSB0aG91c2FuZHMgc2VwYXJhdG9yIChncnApXHJcbmZ1bmN0aW9uIGZvcm1hdF9udW1iZXIobGFiZWwsIHVuaXQsIG5kZWMsIGRlYywgZ3JwKSB7XHJcbiAgaWYgKGlzTmFOKGxhYmVsKSkgcmV0dXJuICcnO1xyXG4gIGlmICh1bml0ID09PSB1bmRlZmluZWQpIHVuaXQgPSAnJztcclxuICBpZiAoZGVjID09PSB1bmRlZmluZWQpIGRlYyA9ICcuJztcclxuICBpZiAoZ3JwID09PSB1bmRlZmluZWQpIGdycCA9ICcnO1xyXG4gIC8vIHJvdW5kIG51bWJlclxyXG4gIGlmIChuZGVjICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGxhYmVsID0gbGFiZWwudG9GaXhlZChuZGVjKTtcclxuICB9IGVsc2Uge1xyXG4gICAgbGFiZWwgPSBsYWJlbC50b1N0cmluZygpO1xyXG4gIH1cclxuICAvLyBGb2xsb3dpbmcgYmFzZWQgb24gY29kZSBmcm9tIFxyXG4gIC8vIGh0dHA6Ly93d3cubXJlZGtqLmNvbS9qYXZhc2NyaXB0L251bWJlckZvcm1hdC5odG1sXHJcbiAgeCAgICAgPSBsYWJlbC5zcGxpdCgnLicpO1xyXG4gIHgxICAgID0geFswXTtcclxuICB4MiAgICA9IHgubGVuZ3RoID4gMSA/IGRlYyArIHhbMV0gOiAnJztcclxuICBpZiAoZ3JwICE9PSAnJykge1xyXG4gICAgdmFyIHJneCA9IC8oXFxkKykoXFxkezN9KS87XHJcbiAgICB3aGlsZSAocmd4LnRlc3QoeDEpKSB7XHJcbiAgICAgIHgxID0geDEucmVwbGFjZShyZ3gsICckMScgKyBncnAgKyAnJDInKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuKHgxICsgeDIgKyB1bml0KTtcclxufVxyXG5cclxuXHJcblxyXG4iLCJcclxuLy8gRm9ybWF0IGEgbnVtZXJpYyB2YWx1ZTpcclxuLy8gLSBNYWtlIHN1cmUgaXQgaXMgcm91bmRlZCB0byB0aGUgY29ycmVjdCBudW1iZXIgb2YgZGVjaW1hbHMgKG5kZWMpXHJcbi8vIC0gVXNlIHRoZSBjb3JyZWN0IGRlY2ltYWwgc2VwYXJhdG9yIChkZWMpXHJcbi8vIC0gQWRkIGEgdGhvdXNhbmRzIHNlcGFyYXRvciAoZ3JwKVxyXG5mb3JtYXRfbnVtZXJpYyA9IGZ1bmN0aW9uKGxhYmVsLCB1bml0LCBuZGVjLCBkZWMsIGdycCkge1xyXG4gIGlmIChpc05hTihsYWJlbCkpIHJldHVybiAnJztcclxuICBpZiAodW5pdCA9PT0gdW5kZWZpbmVkKSB1bml0ID0gJyc7XHJcbiAgaWYgKGRlYyA9PT0gdW5kZWZpbmVkKSBkZWMgPSAnLCc7XHJcbiAgaWYgKGdycCA9PT0gdW5kZWZpbmVkKSBncnAgPSAnICc7XHJcbiAgLy8gcm91bmQgbnVtYmVyXHJcbiAgaWYgKG5kZWMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgbGFiZWwgPSBsYWJlbC50b0ZpeGVkKG5kZWMpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBsYWJlbCA9IGxhYmVsLnRvU3RyaW5nKCk7XHJcbiAgfVxyXG4gIC8vIEZvbGxvd2luZyBiYXNlZCBvbiBjb2RlIGZyb20gXHJcbiAgLy8gaHR0cDovL3d3dy5tcmVka2ouY29tL2phdmFzY3JpcHQvbnVtYmVyRm9ybWF0Lmh0bWxcclxuICB4ICAgICA9IGxhYmVsLnNwbGl0KCcuJyk7XHJcbiAgeDEgICAgPSB4WzBdO1xyXG4gIHgyICAgID0geC5sZW5ndGggPiAxID8gZGVjICsgeFsxXSA6ICcnO1xyXG4gIGlmIChncnAgIT09ICcnKSB7XHJcbiAgICB2YXIgcmd4ID0gLyhcXGQrKShcXGR7M30pLztcclxuICAgIHdoaWxlIChyZ3gudGVzdCh4MSkpIHtcclxuICAgICAgeDEgPSB4MS5yZXBsYWNlKHJneCwgJyQxJyArIGdycCArICckMicpO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4oeDEgKyB4MiArIHVuaXQpO1xyXG59O1xyXG5cclxuXHJcblxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8vID09PT0gICAgICAgICAgICAgICAgICAgICAgICAgV0lMS0lOU09OIEFMR09SSVRITSAgICAgICAgICAgICAgICAgICAgICAgID09PT1cclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuXHJcbmZ1bmN0aW9uIHdpbGtpbnNvbl9paShkbWluLCBkbWF4LCBtLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBtbWluLCBtbWF4LCBRLCBwcmVjaXNpb24sIG1pbmNvdmVyYWdlKSB7XHJcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PSBTVUJST1VUSU5FUyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgLy8gVGhlIGZvbGxvd2luZyByb3V0aW5lIGNoZWNrcyBmb3Igb3ZlcmxhcCBpbiB0aGUgbGFiZWxzLiBUaGlzIGlzIHVzZWQgaW4gdGhlIFxyXG4gIC8vIFdpbGtpbnNvbiBsYWJlbGluZyBhbGdvcml0aG0gYmVsb3cgdG8gZW5zdXJlIHRoYXQgdGhlIGxhYmVscyBkbyBub3Qgb3ZlcmxhcC5cclxuICBmdW5jdGlvbiBvdmVybGFwKGxtaW4sIGxtYXgsIGxzdGVwLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBuZGVjKSB7XHJcbiAgICB2YXIgd2lkdGhfbWF4ID0gbHN0ZXAqYXhpc193aWR0aC8obG1heC1sbWluKTtcclxuICAgIGZvciAodmFyIGwgPSBsbWluOyAobCAtIGxtYXgpIDw9IDFFLTEwOyBsICs9IGxzdGVwKSB7XHJcbiAgICAgIHZhciB3ICA9IGNhbGNfbGFiZWxfd2lkdGgobCwgbmRlYyk7XHJcbiAgICAgIGlmICh3ID4gd2lkdGhfbWF4KSByZXR1cm4odHJ1ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4oZmFsc2UpO1xyXG4gIH1cclxuXHJcbiAgLy8gUGVyZm9ybSBvbmUgaXRlcmF0aW9uIG9mIHRoZSBXaWxraW5zb24gYWxnb3JpdGhtXHJcbiAgZnVuY3Rpb24gd2lsa2luc29uX3N0ZXAobWluLCBtYXgsIGssIG0sIFEsIG1pbmNvdmVyYWdlKSB7XHJcbiAgICAvLyBkZWZhdWx0IHZhbHVlc1xyXG4gICAgUSAgICAgICAgICAgICAgID0gUSAgICAgICAgIHx8IFsxMCwgMSwgNSwgMiwgMi41LCAzLCA0LCAxLjUsIDcsIDYsIDgsIDldO1xyXG4gICAgcHJlY2lzaW9uICAgICAgID0gcHJlY2lzaW9uIHx8IFsxLCAgMCwgMCwgMCwgIC0xLCAwLCAwLCAgLTEsIDAsIDAsIDAsIDBdO1xyXG4gICAgbWluY292ZXJhZ2UgICAgID0gbWluY292ZXJhZ2UgfHwgMC44O1xyXG4gICAgbSAgICAgICAgICAgICAgID0gbSB8fCBrO1xyXG4gICAgLy8gY2FsY3VsYXRlIHNvbWUgc3RhdHMgbmVlZGVkIGluIGxvb3BcclxuICAgIHZhciBpbnRlcnZhbHMgICA9IGsgLSAxO1xyXG4gICAgdmFyIGRlbHRhICAgICAgID0gKG1heCAtIG1pbikgLyBpbnRlcnZhbHM7XHJcbiAgICB2YXIgYmFzZSAgICAgICAgPSBNYXRoLmZsb29yKE1hdGgubG9nKGRlbHRhKS9NYXRoLkxOMTApO1xyXG4gICAgdmFyIGRiYXNlICAgICAgID0gTWF0aC5wb3coMTAsIGJhc2UpO1xyXG4gICAgLy8gY2FsY3VsYXRlIGdyYW51bGFyaXR5OyBvbmUgb2YgdGhlIHRlcm1zIGluIHNjb3JlXHJcbiAgICB2YXIgZ3JhbnVsYXJpdHkgPSAxIC0gTWF0aC5hYnMoay1tKS9tO1xyXG4gICAgLy8gaW5pdGlhbGlzZSBlbmQgcmVzdWx0XHJcbiAgICB2YXIgYmVzdDtcclxuICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgcG9zc2libGUgbGFiZWwgcG9zaXRpb25zIHdpdGggZ2l2ZW4ga1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IFEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgLy8gY2FsY3VsYXRlIGxhYmVsIHBvc2l0aW9uc1xyXG4gICAgICB2YXIgdGRlbHRhID0gUVtpXSAqIGRiYXNlO1xyXG4gICAgICB2YXIgdG1pbiAgID0gTWF0aC5mbG9vcihtaW4vdGRlbHRhKSAqIHRkZWx0YTtcclxuICAgICAgdmFyIHRtYXggICA9IHRtaW4gKyBpbnRlcnZhbHMgKiB0ZGVsdGE7XHJcbiAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbnVtYmVyIG9mIGRlY2ltYWxzXHJcbiAgICAgIHZhciBuZGVjICAgPSAoYmFzZSArIHByZWNpc2lvbltpXSkgPCAwID8gTWF0aC5hYnMoYmFzZSArIHByZWNpc2lvbltpXSkgOiAwO1xyXG4gICAgICAvLyBpZiBsYWJlbCBwb3NpdGlvbnMgY292ZXIgcmFuZ2VcclxuICAgICAgaWYgKHRtaW4gPD0gbWluICYmIHRtYXggPj0gbWF4KSB7XHJcbiAgICAgICAgLy8gY2FsY3VsYXRlIHJvdW5kbmVzcyBhbmQgY292ZXJhZ2UgcGFydCBvZiBzY29yZVxyXG4gICAgICAgIHZhciByb3VuZG5lc3MgPSAxIC0gKGkgLSAodG1pbiA8PSAwICYmIHRtYXggPj0gMCkpIC8gUS5sZW5ndGg7XHJcbiAgICAgICAgdmFyIGNvdmVyYWdlICA9IChtYXgtbWluKS8odG1heC10bWluKTtcclxuICAgICAgICAvLyBpZiBjb3ZlcmFnZSBoaWdoIGVub3VnaFxyXG4gICAgICAgIGlmIChjb3ZlcmFnZSA+IG1pbmNvdmVyYWdlICYmICFvdmVybGFwKHRtaW4sIHRtYXgsIHRkZWx0YSwgY2FsY19sYWJlbF93aWR0aCwgYXhpc193aWR0aCwgbmRlYykpIHtcclxuICAgICAgICAgIC8vIGNhbGN1bGF0ZSBzY29yZVxyXG4gICAgICAgICAgdmFyIHRuaWNlID0gZ3JhbnVsYXJpdHkgKyByb3VuZG5lc3MgKyBjb3ZlcmFnZTtcclxuICAgICAgICAgIC8vIGlmIGhpZ2hlc3Qgc2NvcmVcclxuICAgICAgICAgIGlmICgoYmVzdCA9PT0gdW5kZWZpbmVkKSB8fCAodG5pY2UgPiBiZXN0LnNjb3JlKSkge1xyXG4gICAgICAgICAgICBiZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgJ2xtaW4nICA6IHRtaW4sXHJcbiAgICAgICAgICAgICAgICAnbG1heCcgIDogdG1heCxcclxuICAgICAgICAgICAgICAgICdsc3RlcCcgOiB0ZGVsdGEsXHJcbiAgICAgICAgICAgICAgICAnc2NvcmUnIDogdG5pY2UsXHJcbiAgICAgICAgICAgICAgICAnbmRlYycgIDogbmRlY1xyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyByZXR1cm5cclxuICAgIHJldHVybiAoYmVzdCk7XHJcbiAgfVxyXG5cclxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IE1BSU4gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gIC8vIGRlZmF1bHQgdmFsdWVzXHJcbiAgZG1pbiAgICAgICAgICAgICA9IE51bWJlcihkbWluKTtcclxuICBkbWF4ICAgICAgICAgICAgID0gTnVtYmVyKGRtYXgpO1xyXG4gIGlmIChNYXRoLmFicyhkbWluIC0gZG1heCkgPCAxRS0xMCkge1xyXG4gICAgZG1pbiA9IDAuOTYqZG1pbjtcclxuICAgIGRtYXggPSAxLjA0KmRtYXg7XHJcbiAgfVxyXG4gIGNhbGNfbGFiZWxfd2lkdGggPSBjYWxjX2xhYmVsX3dpZHRoIHx8IGZ1bmN0aW9uKCkgeyByZXR1cm4oMCk7fTtcclxuICBheGlzX3dpZHRoICAgICAgID0gYXhpc193aWR0aCB8fCAxO1xyXG4gIFEgICAgICAgICAgICAgICAgPSBRICAgICAgICAgfHwgWzEwLCAxLCA1LCAyLCAyLjUsIDMsIDQsIDEuNSwgNywgNiwgOCwgOV07XHJcbiAgcHJlY2lzaW9uICAgICAgICA9IHByZWNpc2lvbiB8fCBbMSwgIDAsIDAsIDAsICAtMSwgMCwgMCwgIC0xLCAwLCAwLCAwLCAwXTtcclxuICBtaW5jb3ZlcmFnZSAgICAgID0gbWluY292ZXJhZ2UgfHwgMC44O1xyXG4gIG1taW4gICAgICAgICAgICAgPSBtbWluIHx8IDI7XHJcbiAgbW1heCAgICAgICAgICAgICA9IG1tYXggfHwgTWF0aC5jZWlsKDYqbSk7XHJcbiAgLy8gaW5pdGlsaXNlIGVuZCByZXN1bHRcclxuICB2YXIgYmVzdCA9IHtcclxuICAgICAgJ2xtaW4nICA6IGRtaW4sXHJcbiAgICAgICdsbWF4JyAgOiBkbWF4LFxyXG4gICAgICAnbHN0ZXAnIDogKGRtYXggLSBkbWluKSxcclxuICAgICAgJ3Njb3JlJyA6IC0xRTgsXHJcbiAgICAgICduZGVjJyAgOiAwXHJcbiAgICB9O1xyXG4gIC8vIGNhbGN1bGF0ZSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXNcclxuICB2YXIgeCA9IFN0cmluZyhiZXN0LmxzdGVwKS5zcGxpdCgnLicpO1xyXG4gIGJlc3QubmRlYyA9IHgubGVuZ3RoID4gMSA/IHhbMV0ubGVuZ3RoIDogMDtcclxuICAvLyBsb29wIHRob3VnaCBhbGwgcG9zc2libGUgbnVtYmVycyBvZiBsYWJlbHNcclxuICBmb3IgKHZhciBrID0gbW1pbjsgayA8PSBtbWF4OyBrKyspIHsgXHJcbiAgICAvLyBjYWxjdWxhdGUgYmVzdCBsYWJlbCBwb3NpdGlvbiBmb3IgY3VycmVudCBudW1iZXIgb2YgbGFiZWxzXHJcbiAgICB2YXIgcmVzdWx0ID0gd2lsa2luc29uX3N0ZXAoZG1pbiwgZG1heCwgaywgbSwgUSwgbWluY292ZXJhZ2UpO1xyXG4gICAgLy8gY2hlY2sgaWYgY3VycmVudCByZXN1bHQgaGFzIGhpZ2hlciBzY29yZVxyXG4gICAgaWYgKChyZXN1bHQgIT09IHVuZGVmaW5lZCkgJiYgKChiZXN0ID09PSB1bmRlZmluZWQpIHx8IChyZXN1bHQuc2NvcmUgPiBiZXN0LnNjb3JlKSkpIHtcclxuICAgICAgYmVzdCA9IHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcbiAgLy8gZ2VuZXJhdGUgbGFiZWwgcG9zaXRpb25zXHJcbiAgdmFyIGxhYmVscyA9IFtdO1xyXG4gIGZvciAodmFyIGwgPSBiZXN0LmxtaW47IChsIC0gYmVzdC5sbWF4KSA8PSAxRS0xMDsgbCArPSBiZXN0LmxzdGVwKSB7XHJcbiAgICBsYWJlbHMucHVzaChsKTtcclxuICB9XHJcbiAgYmVzdC5sYWJlbHMgPSBsYWJlbHM7XHJcbiAgcmV0dXJuKGJlc3QpO1xyXG59XHJcblxyXG5cclxuIiwiICBcclxuICBncnBoLmxpbmUgPSBncnBoX2dyYXBoX2xpbmU7XHJcbiAgZ3JwaC5tYXAgPSBncnBoX2dyYXBoX21hcDtcclxuICBncnBoLmJ1YmJsZSA9IGdycGhfZ3JhcGhfYnViYmxlO1xyXG4gIGdycGguYmFyID0gZ3JwaF9ncmFwaF9iYXI7XHJcblxyXG4gIHRoaXMuZ3JwaCA9IGdycGg7XHJcblxyXG59KCkpO1xyXG5cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9