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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vbWVudC5qcyIsInR3aXguanMiLCJiZWdpbi5qcyIsImF4aXNfY2F0ZWdvcmljYWwuanMiLCJheGlzX2NobG9yb3BsZXRoLmpzIiwiYXhpc19jb2xvdXIuanMiLCJheGlzX2xpbmVhci5qcyIsImF4aXNfcGVyaW9kLmpzIiwiYXhpc19yZWdpb24uanMiLCJheGlzX3NpemUuanMiLCJheGlzX3NwbGl0LmpzIiwiYXhpc19zd2l0Y2guanMiLCJkYXRhcGFja2FnZS5qcyIsImRhdGVfcGVyaW9kLmpzIiwiZ2VuZXJpY19ncmFwaC5qcyIsImdyYXBoLmpzIiwiZ3JhcGhfYmFyLmpzIiwiZ3JhcGhfYnViYmxlLmpzIiwiZ3JhcGhfbGluZS5qcyIsImdyYXBoX21hcC5qcyIsImxhYmVsX3NpemUuanMiLCJzY2FsZV9jYXRlZ29yaWNhbC5qcyIsInNjYWxlX2NobG9yb3BsZXRoLmpzIiwic2NhbGVfY29sb3VyLmpzIiwic2NhbGVfbGluZWFyLmpzIiwic2NhbGVfcGVyaW9kLmpzIiwic2NhbGVfc2l6ZS5qcyIsInNldHRpbmdzLmpzIiwidXRpbHMuanMiLCJ3aWxraW5zb24uanMiLCJlbmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNXRCQTtBQUNBO0FBQ0E7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdycGguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyEgbW9tZW50LmpzXHJcbi8vISB2ZXJzaW9uIDogMi43LjBcclxuLy8hIGF1dGhvcnMgOiBUaW0gV29vZCwgSXNrcmVuIENoZXJuZXYsIE1vbWVudC5qcyBjb250cmlidXRvcnNcclxuLy8hIGxpY2Vuc2UgOiBNSVRcclxuLy8hIG1vbWVudGpzLmNvbVxyXG5cclxuKGZ1bmN0aW9uICh1bmRlZmluZWQpIHtcclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgQ29uc3RhbnRzXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gICAgdmFyIG1vbWVudCxcclxuICAgICAgICBWRVJTSU9OID0gXCIyLjcuMFwiLFxyXG4gICAgICAgIC8vIHRoZSBnbG9iYWwtc2NvcGUgdGhpcyBpcyBOT1QgdGhlIGdsb2JhbCBvYmplY3QgaW4gTm9kZS5qc1xyXG4gICAgICAgIGdsb2JhbFNjb3BlID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzLFxyXG4gICAgICAgIG9sZEdsb2JhbE1vbWVudCxcclxuICAgICAgICByb3VuZCA9IE1hdGgucm91bmQsXHJcbiAgICAgICAgaSxcclxuXHJcbiAgICAgICAgWUVBUiA9IDAsXHJcbiAgICAgICAgTU9OVEggPSAxLFxyXG4gICAgICAgIERBVEUgPSAyLFxyXG4gICAgICAgIEhPVVIgPSAzLFxyXG4gICAgICAgIE1JTlVURSA9IDQsXHJcbiAgICAgICAgU0VDT05EID0gNSxcclxuICAgICAgICBNSUxMSVNFQ09ORCA9IDYsXHJcblxyXG4gICAgICAgIC8vIGludGVybmFsIHN0b3JhZ2UgZm9yIGxhbmd1YWdlIGNvbmZpZyBmaWxlc1xyXG4gICAgICAgIGxhbmd1YWdlcyA9IHt9LFxyXG5cclxuICAgICAgICAvLyBtb21lbnQgaW50ZXJuYWwgcHJvcGVydGllc1xyXG4gICAgICAgIG1vbWVudFByb3BlcnRpZXMgPSB7XHJcbiAgICAgICAgICAgIF9pc0FNb21lbnRPYmplY3Q6IG51bGwsXHJcbiAgICAgICAgICAgIF9pIDogbnVsbCxcclxuICAgICAgICAgICAgX2YgOiBudWxsLFxyXG4gICAgICAgICAgICBfbCA6IG51bGwsXHJcbiAgICAgICAgICAgIF9zdHJpY3QgOiBudWxsLFxyXG4gICAgICAgICAgICBfdHptIDogbnVsbCxcclxuICAgICAgICAgICAgX2lzVVRDIDogbnVsbCxcclxuICAgICAgICAgICAgX29mZnNldCA6IG51bGwsICAvLyBvcHRpb25hbC4gQ29tYmluZSB3aXRoIF9pc1VUQ1xyXG4gICAgICAgICAgICBfcGYgOiBudWxsLFxyXG4gICAgICAgICAgICBfbGFuZyA6IG51bGwgIC8vIG9wdGlvbmFsXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8gY2hlY2sgZm9yIG5vZGVKU1xyXG4gICAgICAgIGhhc01vZHVsZSA9ICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyksXHJcblxyXG4gICAgICAgIC8vIEFTUC5ORVQganNvbiBkYXRlIGZvcm1hdCByZWdleFxyXG4gICAgICAgIGFzcE5ldEpzb25SZWdleCA9IC9eXFwvP0RhdGVcXCgoXFwtP1xcZCspL2ksXHJcbiAgICAgICAgYXNwTmV0VGltZVNwYW5Kc29uUmVnZXggPSAvKFxcLSk/KD86KFxcZCopXFwuKT8oXFxkKylcXDooXFxkKykoPzpcXDooXFxkKylcXC4/KFxcZHszfSk/KT8vLFxyXG5cclxuICAgICAgICAvLyBmcm9tIGh0dHA6Ly9kb2NzLmNsb3N1cmUtbGlicmFyeS5nb29nbGVjb2RlLmNvbS9naXQvY2xvc3VyZV9nb29nX2RhdGVfZGF0ZS5qcy5zb3VyY2UuaHRtbFxyXG4gICAgICAgIC8vIHNvbWV3aGF0IG1vcmUgaW4gbGluZSB3aXRoIDQuNC4zLjIgMjAwNCBzcGVjLCBidXQgYWxsb3dzIGRlY2ltYWwgYW55d2hlcmVcclxuICAgICAgICBpc29EdXJhdGlvblJlZ2V4ID0gL14oLSk/UCg/Oig/OihbMC05LC5dKilZKT8oPzooWzAtOSwuXSopTSk/KD86KFswLTksLl0qKUQpPyg/OlQoPzooWzAtOSwuXSopSCk/KD86KFswLTksLl0qKU0pPyg/OihbMC05LC5dKilTKT8pP3woWzAtOSwuXSopVykkLyxcclxuXHJcbiAgICAgICAgLy8gZm9ybWF0IHRva2Vuc1xyXG4gICAgICAgIGZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTW98TU0/TT9NP3xEb3xERERvfEREP0Q/RD98ZGRkP2Q/fGRvP3x3W298d10/fFdbb3xXXT98UXxZWVlZWVl8WVlZWVl8WVlZWXxZWXxnZyhnZ2c/KT98R0coR0dHPyk/fGV8RXxhfEF8aGg/fEhIP3xtbT98c3M/fFN7MSw0fXxYfHp6P3xaWj98LikvZyxcclxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTFR8TEw/TD9MP3xsezEsNH0pL2csXHJcblxyXG4gICAgICAgIC8vIHBhcnNpbmcgdG9rZW4gcmVnZXhlc1xyXG4gICAgICAgIHBhcnNlVG9rZW5PbmVPclR3b0RpZ2l0cyA9IC9cXGRcXGQ/LywgLy8gMCAtIDk5XHJcbiAgICAgICAgcGFyc2VUb2tlbk9uZVRvVGhyZWVEaWdpdHMgPSAvXFxkezEsM30vLCAvLyAwIC0gOTk5XHJcbiAgICAgICAgcGFyc2VUb2tlbk9uZVRvRm91ckRpZ2l0cyA9IC9cXGR7MSw0fS8sIC8vIDAgLSA5OTk5XHJcbiAgICAgICAgcGFyc2VUb2tlbk9uZVRvU2l4RGlnaXRzID0gL1srXFwtXT9cXGR7MSw2fS8sIC8vIC05OTksOTk5IC0gOTk5LDk5OVxyXG4gICAgICAgIHBhcnNlVG9rZW5EaWdpdHMgPSAvXFxkKy8sIC8vIG5vbnplcm8gbnVtYmVyIG9mIGRpZ2l0c1xyXG4gICAgICAgIHBhcnNlVG9rZW5Xb3JkID0gL1swLTldKlsnYS16XFx1MDBBMC1cXHUwNUZGXFx1MDcwMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSt8W1xcdTA2MDAtXFx1MDZGRlxcL10rKFxccyo/W1xcdTA2MDAtXFx1MDZGRl0rKXsxLDJ9L2ksIC8vIGFueSB3b3JkIChvciB0d28pIGNoYXJhY3RlcnMgb3IgbnVtYmVycyBpbmNsdWRpbmcgdHdvL3RocmVlIHdvcmQgbW9udGggaW4gYXJhYmljLlxyXG4gICAgICAgIHBhcnNlVG9rZW5UaW1lem9uZSA9IC9afFtcXCtcXC1dXFxkXFxkOj9cXGRcXGQvZ2ksIC8vICswMDowMCAtMDA6MDAgKzAwMDAgLTAwMDAgb3IgWlxyXG4gICAgICAgIHBhcnNlVG9rZW5UID0gL1QvaSwgLy8gVCAoSVNPIHNlcGFyYXRvcilcclxuICAgICAgICBwYXJzZVRva2VuVGltZXN0YW1wTXMgPSAvW1xcK1xcLV0/XFxkKyhcXC5cXGR7MSwzfSk/LywgLy8gMTIzNDU2Nzg5IDEyMzQ1Njc4OS4xMjNcclxuICAgICAgICBwYXJzZVRva2VuT3JkaW5hbCA9IC9cXGR7MSwyfS8sXHJcblxyXG4gICAgICAgIC8vc3RyaWN0IHBhcnNpbmcgcmVnZXhlc1xyXG4gICAgICAgIHBhcnNlVG9rZW5PbmVEaWdpdCA9IC9cXGQvLCAvLyAwIC0gOVxyXG4gICAgICAgIHBhcnNlVG9rZW5Ud29EaWdpdHMgPSAvXFxkXFxkLywgLy8gMDAgLSA5OVxyXG4gICAgICAgIHBhcnNlVG9rZW5UaHJlZURpZ2l0cyA9IC9cXGR7M30vLCAvLyAwMDAgLSA5OTlcclxuICAgICAgICBwYXJzZVRva2VuRm91ckRpZ2l0cyA9IC9cXGR7NH0vLCAvLyAwMDAwIC0gOTk5OVxyXG4gICAgICAgIHBhcnNlVG9rZW5TaXhEaWdpdHMgPSAvWystXT9cXGR7Nn0vLCAvLyAtOTk5LDk5OSAtIDk5OSw5OTlcclxuICAgICAgICBwYXJzZVRva2VuU2lnbmVkTnVtYmVyID0gL1srLV0/XFxkKy8sIC8vIC1pbmYgLSBpbmZcclxuXHJcbiAgICAgICAgLy8gaXNvIDg2MDEgcmVnZXhcclxuICAgICAgICAvLyAwMDAwLTAwLTAwIDAwMDAtVzAwIG9yIDAwMDAtVzAwLTAgKyBUICsgMDAgb3IgMDA6MDAgb3IgMDA6MDA6MDAgb3IgMDA6MDA6MDAuMDAwICsgKzAwOjAwIG9yICswMDAwIG9yICswMClcclxuICAgICAgICBpc29SZWdleCA9IC9eXFxzKig/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzooXFxkXFxkLVxcZFxcZCl8KFdcXGRcXGQkKXwoV1xcZFxcZC1cXGQpfChcXGRcXGRcXGQpKSgoVHwgKShcXGRcXGQoOlxcZFxcZCg6XFxkXFxkKFxcLlxcZCspPyk/KT8pPyhbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC8sXHJcblxyXG4gICAgICAgIGlzb0Zvcm1hdCA9ICdZWVlZLU1NLUREVEhIOm1tOnNzWicsXHJcblxyXG4gICAgICAgIGlzb0RhdGVzID0gW1xyXG4gICAgICAgICAgICBbJ1lZWVlZWS1NTS1ERCcsIC9bKy1dXFxkezZ9LVxcZHsyfS1cXGR7Mn0vXSxcclxuICAgICAgICAgICAgWydZWVlZLU1NLUREJywgL1xcZHs0fS1cXGR7Mn0tXFxkezJ9L10sXHJcbiAgICAgICAgICAgIFsnR0dHRy1bV11XVy1FJywgL1xcZHs0fS1XXFxkezJ9LVxcZC9dLFxyXG4gICAgICAgICAgICBbJ0dHR0ctW1ddV1cnLCAvXFxkezR9LVdcXGR7Mn0vXSxcclxuICAgICAgICAgICAgWydZWVlZLURERCcsIC9cXGR7NH0tXFxkezN9L11cclxuICAgICAgICBdLFxyXG5cclxuICAgICAgICAvLyBpc28gdGltZSBmb3JtYXRzIGFuZCByZWdleGVzXHJcbiAgICAgICAgaXNvVGltZXMgPSBbXHJcbiAgICAgICAgICAgIFsnSEg6bW06c3MuU1NTUycsIC8oVHwgKVxcZFxcZDpcXGRcXGQ6XFxkXFxkXFwuXFxkKy9dLFxyXG4gICAgICAgICAgICBbJ0hIOm1tOnNzJywgLyhUfCApXFxkXFxkOlxcZFxcZDpcXGRcXGQvXSxcclxuICAgICAgICAgICAgWydISDptbScsIC8oVHwgKVxcZFxcZDpcXGRcXGQvXSxcclxuICAgICAgICAgICAgWydISCcsIC8oVHwgKVxcZFxcZC9dXHJcbiAgICAgICAgXSxcclxuXHJcbiAgICAgICAgLy8gdGltZXpvbmUgY2h1bmtlciBcIisxMDowMFwiID4gW1wiMTBcIiwgXCIwMFwiXSBvciBcIi0xNTMwXCIgPiBbXCItMTVcIiwgXCIzMFwiXVxyXG4gICAgICAgIHBhcnNlVGltZXpvbmVDaHVua2VyID0gLyhbXFwrXFwtXXxcXGRcXGQpL2dpLFxyXG5cclxuICAgICAgICAvLyBnZXR0ZXIgYW5kIHNldHRlciBuYW1lc1xyXG4gICAgICAgIHByb3h5R2V0dGVyc0FuZFNldHRlcnMgPSAnRGF0ZXxIb3Vyc3xNaW51dGVzfFNlY29uZHN8TWlsbGlzZWNvbmRzJy5zcGxpdCgnfCcpLFxyXG4gICAgICAgIHVuaXRNaWxsaXNlY29uZEZhY3RvcnMgPSB7XHJcbiAgICAgICAgICAgICdNaWxsaXNlY29uZHMnIDogMSxcclxuICAgICAgICAgICAgJ1NlY29uZHMnIDogMWUzLFxyXG4gICAgICAgICAgICAnTWludXRlcycgOiA2ZTQsXHJcbiAgICAgICAgICAgICdIb3VycycgOiAzNmU1LFxyXG4gICAgICAgICAgICAnRGF5cycgOiA4NjRlNSxcclxuICAgICAgICAgICAgJ01vbnRocycgOiAyNTkyZTYsXHJcbiAgICAgICAgICAgICdZZWFycycgOiAzMTUzNmU2XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdW5pdEFsaWFzZXMgPSB7XHJcbiAgICAgICAgICAgIG1zIDogJ21pbGxpc2Vjb25kJyxcclxuICAgICAgICAgICAgcyA6ICdzZWNvbmQnLFxyXG4gICAgICAgICAgICBtIDogJ21pbnV0ZScsXHJcbiAgICAgICAgICAgIGggOiAnaG91cicsXHJcbiAgICAgICAgICAgIGQgOiAnZGF5JyxcclxuICAgICAgICAgICAgRCA6ICdkYXRlJyxcclxuICAgICAgICAgICAgdyA6ICd3ZWVrJyxcclxuICAgICAgICAgICAgVyA6ICdpc29XZWVrJyxcclxuICAgICAgICAgICAgTSA6ICdtb250aCcsXHJcbiAgICAgICAgICAgIFEgOiAncXVhcnRlcicsXHJcbiAgICAgICAgICAgIHkgOiAneWVhcicsXHJcbiAgICAgICAgICAgIERERCA6ICdkYXlPZlllYXInLFxyXG4gICAgICAgICAgICBlIDogJ3dlZWtkYXknLFxyXG4gICAgICAgICAgICBFIDogJ2lzb1dlZWtkYXknLFxyXG4gICAgICAgICAgICBnZzogJ3dlZWtZZWFyJyxcclxuICAgICAgICAgICAgR0c6ICdpc29XZWVrWWVhcidcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBjYW1lbEZ1bmN0aW9ucyA9IHtcclxuICAgICAgICAgICAgZGF5b2Z5ZWFyIDogJ2RheU9mWWVhcicsXHJcbiAgICAgICAgICAgIGlzb3dlZWtkYXkgOiAnaXNvV2Vla2RheScsXHJcbiAgICAgICAgICAgIGlzb3dlZWsgOiAnaXNvV2VlaycsXHJcbiAgICAgICAgICAgIHdlZWt5ZWFyIDogJ3dlZWtZZWFyJyxcclxuICAgICAgICAgICAgaXNvd2Vla3llYXIgOiAnaXNvV2Vla1llYXInXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8gZm9ybWF0IGZ1bmN0aW9uIHN0cmluZ3NcclxuICAgICAgICBmb3JtYXRGdW5jdGlvbnMgPSB7fSxcclxuXHJcbiAgICAgICAgLy8gZGVmYXVsdCByZWxhdGl2ZSB0aW1lIHRocmVzaG9sZHNcclxuICAgICAgICByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzID0ge1xyXG4gICAgICAgICAgczogNDUsICAgLy9zZWNvbmRzIHRvIG1pbnV0ZXNcclxuICAgICAgICAgIG06IDQ1LCAgIC8vbWludXRlcyB0byBob3Vyc1xyXG4gICAgICAgICAgaDogMjIsICAgLy9ob3VycyB0byBkYXlzXHJcbiAgICAgICAgICBkZDogMjUsICAvL2RheXMgdG8gbW9udGggKG1vbnRoID09IDEpXHJcbiAgICAgICAgICBkbTogNDUsICAvL2RheXMgdG8gbW9udGhzIChtb250aHMgPiAxKVxyXG4gICAgICAgICAgZHk6IDM0NSAgLy9kYXlzIHRvIHllYXJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyB0b2tlbnMgdG8gb3JkaW5hbGl6ZSBhbmQgcGFkXHJcbiAgICAgICAgb3JkaW5hbGl6ZVRva2VucyA9ICdEREQgdyBXIE0gRCBkJy5zcGxpdCgnICcpLFxyXG4gICAgICAgIHBhZGRlZFRva2VucyA9ICdNIEQgSCBoIG0gcyB3IFcnLnNwbGl0KCcgJyksXHJcblxyXG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zID0ge1xyXG4gICAgICAgICAgICBNICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9udGgoKSArIDE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIE1NTSAgOiBmdW5jdGlvbiAoZm9ybWF0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubW9udGhzU2hvcnQodGhpcywgZm9ybWF0KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgTU1NTSA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5tb250aHModGhpcywgZm9ybWF0KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgRCAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGUoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgREREICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRheU9mWWVhcigpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBkICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF5KCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGRkICAgOiBmdW5jdGlvbiAoZm9ybWF0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkud2Vla2RheXNNaW4odGhpcywgZm9ybWF0KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGRkICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS53ZWVrZGF5c1Nob3J0KHRoaXMsIGZvcm1hdCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGRkZGQgOiBmdW5jdGlvbiAoZm9ybWF0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkud2Vla2RheXModGhpcywgZm9ybWF0KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdyAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndlZWsoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgVyAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzb1dlZWsoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgWVkgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy55ZWFyKCkgJSAxMDAsIDIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBZWVlZIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLnllYXIoKSwgNCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFlZWVlZIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLnllYXIoKSwgNSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFlZWVlZWSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy55ZWFyKCksIHNpZ24gPSB5ID49IDAgPyAnKycgOiAnLSc7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2lnbiArIGxlZnRaZXJvRmlsbChNYXRoLmFicyh5KSwgNik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdnICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMud2Vla1llYXIoKSAlIDEwMCwgMik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdnZ2cgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMud2Vla1llYXIoKSwgNCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdnZ2dnIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLndlZWtZZWFyKCksIDUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHRyAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLmlzb1dlZWtZZWFyKCkgJSAxMDAsIDIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHR0dHIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLmlzb1dlZWtZZWFyKCksIDQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHR0dHRyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5pc29XZWVrWWVhcigpLCA1KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndlZWtkYXkoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgRSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzb1dlZWtkYXkoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYSAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5tZXJpZGllbSh0aGlzLmhvdXJzKCksIHRoaXMubWludXRlcygpLCB0cnVlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQSAgICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5tZXJpZGllbSh0aGlzLmhvdXJzKCksIHRoaXMubWludXRlcygpLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEggICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ob3VycygpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBoICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaG91cnMoKSAlIDEyIHx8IDEyO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWludXRlcygpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2Vjb25kcygpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBTICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvSW50KHRoaXMubWlsbGlzZWNvbmRzKCkgLyAxMDApO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBTUyAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0b0ludCh0aGlzLm1pbGxpc2Vjb25kcygpIC8gMTApLCAyKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgU1NTICA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5taWxsaXNlY29uZHMoKSwgMyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFNTU1MgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMubWlsbGlzZWNvbmRzKCksIDMpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBaICAgIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSAtdGhpcy56b25lKCksXHJcbiAgICAgICAgICAgICAgICAgICAgYiA9IFwiK1wiO1xyXG4gICAgICAgICAgICAgICAgaWYgKGEgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYSA9IC1hO1xyXG4gICAgICAgICAgICAgICAgICAgIGIgPSBcIi1cIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiICsgbGVmdFplcm9GaWxsKHRvSW50KGEgLyA2MCksIDIpICsgXCI6XCIgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSkgJSA2MCwgMik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFpaICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IC10aGlzLnpvbmUoKSxcclxuICAgICAgICAgICAgICAgICAgICBiID0gXCIrXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoYSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICAgICAgICAgICAgYiA9IFwiLVwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGIgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSAvIDYwKSwgMikgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSkgJSA2MCwgMik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHogOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy56b25lQWJicigpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB6eiA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnpvbmVOYW1lKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFggICAgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51bml4KCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFEgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWFydGVyKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsaXN0cyA9IFsnbW9udGhzJywgJ21vbnRoc1Nob3J0JywgJ3dlZWtkYXlzJywgJ3dlZWtkYXlzU2hvcnQnLCAnd2Vla2RheXNNaW4nXTtcclxuXHJcbiAgICAvLyBQaWNrIHRoZSBmaXJzdCBkZWZpbmVkIG9mIHR3byBvciB0aHJlZSBhcmd1bWVudHMuIGRmbCBjb21lcyBmcm9tXHJcbiAgICAvLyBkZWZhdWx0LlxyXG4gICAgZnVuY3Rpb24gZGZsKGEsIGIsIGMpIHtcclxuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gYSAhPSBudWxsID8gYSA6IGI7XHJcbiAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIGEgIT0gbnVsbCA/IGEgOiBiICE9IG51bGwgPyBiIDogYztcclxuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKFwiSW1wbGVtZW50IG1lXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWZhdWx0UGFyc2luZ0ZsYWdzKCkge1xyXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gZGVlcCBjbG9uZSB0aGlzIG9iamVjdCwgYW5kIGVzNSBzdGFuZGFyZCBpcyBub3QgdmVyeVxyXG4gICAgICAgIC8vIGhlbHBmdWwuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZW1wdHkgOiBmYWxzZSxcclxuICAgICAgICAgICAgdW51c2VkVG9rZW5zIDogW10sXHJcbiAgICAgICAgICAgIHVudXNlZElucHV0IDogW10sXHJcbiAgICAgICAgICAgIG92ZXJmbG93IDogLTIsXHJcbiAgICAgICAgICAgIGNoYXJzTGVmdE92ZXIgOiAwLFxyXG4gICAgICAgICAgICBudWxsSW5wdXQgOiBmYWxzZSxcclxuICAgICAgICAgICAgaW52YWxpZE1vbnRoIDogbnVsbCxcclxuICAgICAgICAgICAgaW52YWxpZEZvcm1hdCA6IGZhbHNlLFxyXG4gICAgICAgICAgICB1c2VySW52YWxpZGF0ZWQgOiBmYWxzZSxcclxuICAgICAgICAgICAgaXNvOiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVwcmVjYXRlKG1zZywgZm4pIHtcclxuICAgICAgICB2YXIgZmlyc3RUaW1lID0gdHJ1ZTtcclxuICAgICAgICBmdW5jdGlvbiBwcmludE1zZygpIHtcclxuICAgICAgICAgICAgaWYgKG1vbWVudC5zdXBwcmVzc0RlcHJlY2F0aW9uV2FybmluZ3MgPT09IGZhbHNlICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmIGNvbnNvbGUud2Fybikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRGVwcmVjYXRpb24gd2FybmluZzogXCIgKyBtc2cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBleHRlbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoZmlyc3RUaW1lKSB7XHJcbiAgICAgICAgICAgICAgICBwcmludE1zZygpO1xyXG4gICAgICAgICAgICAgICAgZmlyc3RUaW1lID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfSwgZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhZFRva2VuKGZ1bmMsIGNvdW50KSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwoZnVuYy5jYWxsKHRoaXMsIGEpLCBjb3VudCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIG9yZGluYWxpemVUb2tlbihmdW5jLCBwZXJpb2QpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLm9yZGluYWwoZnVuYy5jYWxsKHRoaXMsIGEpLCBwZXJpb2QpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUgKG9yZGluYWxpemVUb2tlbnMubGVuZ3RoKSB7XHJcbiAgICAgICAgaSA9IG9yZGluYWxpemVUb2tlbnMucG9wKCk7XHJcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbaSArICdvJ10gPSBvcmRpbmFsaXplVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnNbaV0sIGkpO1xyXG4gICAgfVxyXG4gICAgd2hpbGUgKHBhZGRlZFRva2Vucy5sZW5ndGgpIHtcclxuICAgICAgICBpID0gcGFkZGVkVG9rZW5zLnBvcCgpO1xyXG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW2kgKyBpXSA9IHBhZFRva2VuKGZvcm1hdFRva2VuRnVuY3Rpb25zW2ldLCAyKTtcclxuICAgIH1cclxuICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zLkREREQgPSBwYWRUb2tlbihmb3JtYXRUb2tlbkZ1bmN0aW9ucy5EREQsIDMpO1xyXG5cclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgQ29uc3RydWN0b3JzXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gICAgZnVuY3Rpb24gTGFuZ3VhZ2UoKSB7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vbWVudCBwcm90b3R5cGUgb2JqZWN0XHJcbiAgICBmdW5jdGlvbiBNb21lbnQoY29uZmlnKSB7XHJcbiAgICAgICAgY2hlY2tPdmVyZmxvdyhjb25maWcpO1xyXG4gICAgICAgIGV4dGVuZCh0aGlzLCBjb25maWcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIER1cmF0aW9uIENvbnN0cnVjdG9yXHJcbiAgICBmdW5jdGlvbiBEdXJhdGlvbihkdXJhdGlvbikge1xyXG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVPYmplY3RVbml0cyhkdXJhdGlvbiksXHJcbiAgICAgICAgICAgIHllYXJzID0gbm9ybWFsaXplZElucHV0LnllYXIgfHwgMCxcclxuICAgICAgICAgICAgcXVhcnRlcnMgPSBub3JtYWxpemVkSW5wdXQucXVhcnRlciB8fCAwLFxyXG4gICAgICAgICAgICBtb250aHMgPSBub3JtYWxpemVkSW5wdXQubW9udGggfHwgMCxcclxuICAgICAgICAgICAgd2Vla3MgPSBub3JtYWxpemVkSW5wdXQud2VlayB8fCAwLFxyXG4gICAgICAgICAgICBkYXlzID0gbm9ybWFsaXplZElucHV0LmRheSB8fCAwLFxyXG4gICAgICAgICAgICBob3VycyA9IG5vcm1hbGl6ZWRJbnB1dC5ob3VyIHx8IDAsXHJcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBub3JtYWxpemVkSW5wdXQubWludXRlIHx8IDAsXHJcbiAgICAgICAgICAgIHNlY29uZHMgPSBub3JtYWxpemVkSW5wdXQuc2Vjb25kIHx8IDAsXHJcbiAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5taWxsaXNlY29uZCB8fCAwO1xyXG5cclxuICAgICAgICAvLyByZXByZXNlbnRhdGlvbiBmb3IgZGF0ZUFkZFJlbW92ZVxyXG4gICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9ICttaWxsaXNlY29uZHMgK1xyXG4gICAgICAgICAgICBzZWNvbmRzICogMWUzICsgLy8gMTAwMFxyXG4gICAgICAgICAgICBtaW51dGVzICogNmU0ICsgLy8gMTAwMCAqIDYwXHJcbiAgICAgICAgICAgIGhvdXJzICogMzZlNTsgLy8gMTAwMCAqIDYwICogNjBcclxuICAgICAgICAvLyBCZWNhdXNlIG9mIGRhdGVBZGRSZW1vdmUgdHJlYXRzIDI0IGhvdXJzIGFzIGRpZmZlcmVudCBmcm9tIGFcclxuICAgICAgICAvLyBkYXkgd2hlbiB3b3JraW5nIGFyb3VuZCBEU1QsIHdlIG5lZWQgdG8gc3RvcmUgdGhlbSBzZXBhcmF0ZWx5XHJcbiAgICAgICAgdGhpcy5fZGF5cyA9ICtkYXlzICtcclxuICAgICAgICAgICAgd2Vla3MgKiA3O1xyXG4gICAgICAgIC8vIEl0IGlzIGltcG9zc2libGUgdHJhbnNsYXRlIG1vbnRocyBpbnRvIGRheXMgd2l0aG91dCBrbm93aW5nXHJcbiAgICAgICAgLy8gd2hpY2ggbW9udGhzIHlvdSBhcmUgYXJlIHRhbGtpbmcgYWJvdXQsIHNvIHdlIGhhdmUgdG8gc3RvcmVcclxuICAgICAgICAvLyBpdCBzZXBhcmF0ZWx5LlxyXG4gICAgICAgIHRoaXMuX21vbnRocyA9ICttb250aHMgK1xyXG4gICAgICAgICAgICBxdWFydGVycyAqIDMgK1xyXG4gICAgICAgICAgICB5ZWFycyAqIDEyO1xyXG5cclxuICAgICAgICB0aGlzLl9kYXRhID0ge307XHJcblxyXG4gICAgICAgIHRoaXMuX2J1YmJsZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBIZWxwZXJzXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSBpbiBiKSB7XHJcbiAgICAgICAgICAgIGlmIChiLmhhc093blByb3BlcnR5KGkpKSB7XHJcbiAgICAgICAgICAgICAgICBhW2ldID0gYltpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGIuaGFzT3duUHJvcGVydHkoXCJ0b1N0cmluZ1wiKSkge1xyXG4gICAgICAgICAgICBhLnRvU3RyaW5nID0gYi50b1N0cmluZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChiLmhhc093blByb3BlcnR5KFwidmFsdWVPZlwiKSkge1xyXG4gICAgICAgICAgICBhLnZhbHVlT2YgPSBiLnZhbHVlT2Y7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbG9uZU1vbWVudChtKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9LCBpO1xyXG4gICAgICAgIGZvciAoaSBpbiBtKSB7XHJcbiAgICAgICAgICAgIGlmIChtLmhhc093blByb3BlcnR5KGkpICYmIG1vbWVudFByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtpXSA9IG1baV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYWJzUm91bmQobnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKG51bWJlciA8IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGxlZnQgemVybyBmaWxsIGEgbnVtYmVyXHJcbiAgICAvLyBzZWUgaHR0cDovL2pzcGVyZi5jb20vbGVmdC16ZXJvLWZpbGxpbmcgZm9yIHBlcmZvcm1hbmNlIGNvbXBhcmlzb25cclxuICAgIGZ1bmN0aW9uIGxlZnRaZXJvRmlsbChudW1iZXIsIHRhcmdldExlbmd0aCwgZm9yY2VTaWduKSB7XHJcbiAgICAgICAgdmFyIG91dHB1dCA9ICcnICsgTWF0aC5hYnMobnVtYmVyKSxcclxuICAgICAgICAgICAgc2lnbiA9IG51bWJlciA+PSAwO1xyXG5cclxuICAgICAgICB3aGlsZSAob3V0cHV0Lmxlbmd0aCA8IHRhcmdldExlbmd0aCkge1xyXG4gICAgICAgICAgICBvdXRwdXQgPSAnMCcgKyBvdXRwdXQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAoc2lnbiA/IChmb3JjZVNpZ24gPyAnKycgOiAnJykgOiAnLScpICsgb3V0cHV0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGhlbHBlciBmdW5jdGlvbiBmb3IgXy5hZGRUaW1lIGFuZCBfLnN1YnRyYWN0VGltZVxyXG4gICAgZnVuY3Rpb24gYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudChtb20sIGR1cmF0aW9uLCBpc0FkZGluZywgdXBkYXRlT2Zmc2V0KSB7XHJcbiAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IGR1cmF0aW9uLl9taWxsaXNlY29uZHMsXHJcbiAgICAgICAgICAgIGRheXMgPSBkdXJhdGlvbi5fZGF5cyxcclxuICAgICAgICAgICAgbW9udGhzID0gZHVyYXRpb24uX21vbnRocztcclxuICAgICAgICB1cGRhdGVPZmZzZXQgPSB1cGRhdGVPZmZzZXQgPT0gbnVsbCA/IHRydWUgOiB1cGRhdGVPZmZzZXQ7XHJcblxyXG4gICAgICAgIGlmIChtaWxsaXNlY29uZHMpIHtcclxuICAgICAgICAgICAgbW9tLl9kLnNldFRpbWUoK21vbS5fZCArIG1pbGxpc2Vjb25kcyAqIGlzQWRkaW5nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRheXMpIHtcclxuICAgICAgICAgICAgcmF3U2V0dGVyKG1vbSwgJ0RhdGUnLCByYXdHZXR0ZXIobW9tLCAnRGF0ZScpICsgZGF5cyAqIGlzQWRkaW5nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1vbnRocykge1xyXG4gICAgICAgICAgICByYXdNb250aFNldHRlcihtb20sIHJhd0dldHRlcihtb20sICdNb250aCcpICsgbW9udGhzICogaXNBZGRpbmcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodXBkYXRlT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQobW9tLCBkYXlzIHx8IG1vbnRocyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNoZWNrIGlmIGlzIGFuIGFycmF5XHJcbiAgICBmdW5jdGlvbiBpc0FycmF5KGlucHV0KSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNEYXRlKGlucHV0KSB7XHJcbiAgICAgICAgcmV0dXJuICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBEYXRlXScgfHxcclxuICAgICAgICAgICAgICAgIGlucHV0IGluc3RhbmNlb2YgRGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjb21wYXJlIHR3byBhcnJheXMsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRpZmZlcmVuY2VzXHJcbiAgICBmdW5jdGlvbiBjb21wYXJlQXJyYXlzKGFycmF5MSwgYXJyYXkyLCBkb250Q29udmVydCkge1xyXG4gICAgICAgIHZhciBsZW4gPSBNYXRoLm1pbihhcnJheTEubGVuZ3RoLCBhcnJheTIubGVuZ3RoKSxcclxuICAgICAgICAgICAgbGVuZ3RoRGlmZiA9IE1hdGguYWJzKGFycmF5MS5sZW5ndGggLSBhcnJheTIubGVuZ3RoKSxcclxuICAgICAgICAgICAgZGlmZnMgPSAwLFxyXG4gICAgICAgICAgICBpO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoKGRvbnRDb252ZXJ0ICYmIGFycmF5MVtpXSAhPT0gYXJyYXkyW2ldKSB8fFxyXG4gICAgICAgICAgICAgICAgKCFkb250Q29udmVydCAmJiB0b0ludChhcnJheTFbaV0pICE9PSB0b0ludChhcnJheTJbaV0pKSkge1xyXG4gICAgICAgICAgICAgICAgZGlmZnMrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGlmZnMgKyBsZW5ndGhEaWZmO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZVVuaXRzKHVuaXRzKSB7XHJcbiAgICAgICAgaWYgKHVuaXRzKSB7XHJcbiAgICAgICAgICAgIHZhciBsb3dlcmVkID0gdW5pdHMudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC8oLilzJC8sICckMScpO1xyXG4gICAgICAgICAgICB1bml0cyA9IHVuaXRBbGlhc2VzW3VuaXRzXSB8fCBjYW1lbEZ1bmN0aW9uc1tsb3dlcmVkXSB8fCBsb3dlcmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdW5pdHM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplT2JqZWN0VW5pdHMoaW5wdXRPYmplY3QpIHtcclxuICAgICAgICB2YXIgbm9ybWFsaXplZElucHV0ID0ge30sXHJcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wLFxyXG4gICAgICAgICAgICBwcm9wO1xyXG5cclxuICAgICAgICBmb3IgKHByb3AgaW4gaW5wdXRPYmplY3QpIHtcclxuICAgICAgICAgICAgaWYgKGlucHV0T2JqZWN0Lmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcCA9IG5vcm1hbGl6ZVVuaXRzKHByb3ApO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRQcm9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZElucHV0W25vcm1hbGl6ZWRQcm9wXSA9IGlucHV0T2JqZWN0W3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbm9ybWFsaXplZElucHV0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VMaXN0KGZpZWxkKSB7XHJcbiAgICAgICAgdmFyIGNvdW50LCBzZXR0ZXI7XHJcblxyXG4gICAgICAgIGlmIChmaWVsZC5pbmRleE9mKCd3ZWVrJykgPT09IDApIHtcclxuICAgICAgICAgICAgY291bnQgPSA3O1xyXG4gICAgICAgICAgICBzZXR0ZXIgPSAnZGF5JztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoZmllbGQuaW5kZXhPZignbW9udGgnKSA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb3VudCA9IDEyO1xyXG4gICAgICAgICAgICBzZXR0ZXIgPSAnbW9udGgnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbW9tZW50W2ZpZWxkXSA9IGZ1bmN0aW9uIChmb3JtYXQsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBpLCBnZXR0ZXIsXHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSBtb21lbnQuZm4uX2xhbmdbZmllbGRdLFxyXG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXQgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcclxuICAgICAgICAgICAgICAgIGZvcm1hdCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2V0dGVyID0gZnVuY3Rpb24gKGkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtID0gbW9tZW50KCkudXRjKCkuc2V0KHNldHRlciwgaSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWV0aG9kLmNhbGwobW9tZW50LmZuLl9sYW5nLCBtLCBmb3JtYXQgfHwgJycpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKGluZGV4ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXR0ZXIoaW5kZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZ2V0dGVyKGkpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0b0ludChhcmd1bWVudEZvckNvZXJjaW9uKSB7XHJcbiAgICAgICAgdmFyIGNvZXJjZWROdW1iZXIgPSArYXJndW1lbnRGb3JDb2VyY2lvbixcclxuICAgICAgICAgICAgdmFsdWUgPSAwO1xyXG5cclxuICAgICAgICBpZiAoY29lcmNlZE51bWJlciAhPT0gMCAmJiBpc0Zpbml0ZShjb2VyY2VkTnVtYmVyKSkge1xyXG4gICAgICAgICAgICBpZiAoY29lcmNlZE51bWJlciA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IE1hdGguZmxvb3IoY29lcmNlZE51bWJlcik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IE1hdGguY2VpbChjb2VyY2VkTnVtYmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRheXNJbk1vbnRoKHllYXIsIG1vbnRoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKHllYXIsIG1vbnRoICsgMSwgMCkpLmdldFVUQ0RhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB3ZWVrc0luWWVhcih5ZWFyLCBkb3csIGRveSkge1xyXG4gICAgICAgIHJldHVybiB3ZWVrT2ZZZWFyKG1vbWVudChbeWVhciwgMTEsIDMxICsgZG93IC0gZG95XSksIGRvdywgZG95KS53ZWVrO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRheXNJblllYXIoeWVhcikge1xyXG4gICAgICAgIHJldHVybiBpc0xlYXBZZWFyKHllYXIpID8gMzY2IDogMzY1O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzTGVhcFllYXIoeWVhcikge1xyXG4gICAgICAgIHJldHVybiAoeWVhciAlIDQgPT09IDAgJiYgeWVhciAlIDEwMCAhPT0gMCkgfHwgeWVhciAlIDQwMCA9PT0gMDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjaGVja092ZXJmbG93KG0pIHtcclxuICAgICAgICB2YXIgb3ZlcmZsb3c7XHJcbiAgICAgICAgaWYgKG0uX2EgJiYgbS5fcGYub3ZlcmZsb3cgPT09IC0yKSB7XHJcbiAgICAgICAgICAgIG92ZXJmbG93ID1cclxuICAgICAgICAgICAgICAgIG0uX2FbTU9OVEhdIDwgMCB8fCBtLl9hW01PTlRIXSA+IDExID8gTU9OVEggOlxyXG4gICAgICAgICAgICAgICAgbS5fYVtEQVRFXSA8IDEgfHwgbS5fYVtEQVRFXSA+IGRheXNJbk1vbnRoKG0uX2FbWUVBUl0sIG0uX2FbTU9OVEhdKSA/IERBVEUgOlxyXG4gICAgICAgICAgICAgICAgbS5fYVtIT1VSXSA8IDAgfHwgbS5fYVtIT1VSXSA+IDIzID8gSE9VUiA6XHJcbiAgICAgICAgICAgICAgICBtLl9hW01JTlVURV0gPCAwIHx8IG0uX2FbTUlOVVRFXSA+IDU5ID8gTUlOVVRFIDpcclxuICAgICAgICAgICAgICAgIG0uX2FbU0VDT05EXSA8IDAgfHwgbS5fYVtTRUNPTkRdID4gNTkgPyBTRUNPTkQgOlxyXG4gICAgICAgICAgICAgICAgbS5fYVtNSUxMSVNFQ09ORF0gPCAwIHx8IG0uX2FbTUlMTElTRUNPTkRdID4gOTk5ID8gTUlMTElTRUNPTkQgOlxyXG4gICAgICAgICAgICAgICAgLTE7XHJcblxyXG4gICAgICAgICAgICBpZiAobS5fcGYuX292ZXJmbG93RGF5T2ZZZWFyICYmIChvdmVyZmxvdyA8IFlFQVIgfHwgb3ZlcmZsb3cgPiBEQVRFKSkge1xyXG4gICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSBEQVRFO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtLl9wZi5vdmVyZmxvdyA9IG92ZXJmbG93O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc1ZhbGlkKG0pIHtcclxuICAgICAgICBpZiAobS5faXNWYWxpZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIG0uX2lzVmFsaWQgPSAhaXNOYU4obS5fZC5nZXRUaW1lKCkpICYmXHJcbiAgICAgICAgICAgICAgICBtLl9wZi5vdmVyZmxvdyA8IDAgJiZcclxuICAgICAgICAgICAgICAgICFtLl9wZi5lbXB0eSAmJlxyXG4gICAgICAgICAgICAgICAgIW0uX3BmLmludmFsaWRNb250aCAmJlxyXG4gICAgICAgICAgICAgICAgIW0uX3BmLm51bGxJbnB1dCAmJlxyXG4gICAgICAgICAgICAgICAgIW0uX3BmLmludmFsaWRGb3JtYXQgJiZcclxuICAgICAgICAgICAgICAgICFtLl9wZi51c2VySW52YWxpZGF0ZWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAobS5fc3RyaWN0KSB7XHJcbiAgICAgICAgICAgICAgICBtLl9pc1ZhbGlkID0gbS5faXNWYWxpZCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIG0uX3BmLmNoYXJzTGVmdE92ZXIgPT09IDAgJiZcclxuICAgICAgICAgICAgICAgICAgICBtLl9wZi51bnVzZWRUb2tlbnMubGVuZ3RoID09PSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBtLl9pc1ZhbGlkO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZUxhbmd1YWdlKGtleSkge1xyXG4gICAgICAgIHJldHVybiBrZXkgPyBrZXkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCdfJywgJy0nKSA6IGtleTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZXR1cm4gYSBtb21lbnQgZnJvbSBpbnB1dCwgdGhhdCBpcyBsb2NhbC91dGMvem9uZSBlcXVpdmFsZW50IHRvIG1vZGVsLlxyXG4gICAgZnVuY3Rpb24gbWFrZUFzKGlucHV0LCBtb2RlbCkge1xyXG4gICAgICAgIHJldHVybiBtb2RlbC5faXNVVEMgPyBtb21lbnQoaW5wdXQpLnpvbmUobW9kZWwuX29mZnNldCB8fCAwKSA6XHJcbiAgICAgICAgICAgIG1vbWVudChpbnB1dCkubG9jYWwoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgTGFuZ3VhZ2VzXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIGV4dGVuZChMYW5ndWFnZS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAgICAgc2V0IDogZnVuY3Rpb24gKGNvbmZpZykge1xyXG4gICAgICAgICAgICB2YXIgcHJvcCwgaTtcclxuICAgICAgICAgICAgZm9yIChpIGluIGNvbmZpZykge1xyXG4gICAgICAgICAgICAgICAgcHJvcCA9IGNvbmZpZ1tpXTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcHJvcCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbaV0gPSBwcm9wO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzWydfJyArIGldID0gcHJvcDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9tb250aHMgOiBcIkphbnVhcnlfRmVicnVhcnlfTWFyY2hfQXByaWxfTWF5X0p1bmVfSnVseV9BdWd1c3RfU2VwdGVtYmVyX09jdG9iZXJfTm92ZW1iZXJfRGVjZW1iZXJcIi5zcGxpdChcIl9cIiksXHJcbiAgICAgICAgbW9udGhzIDogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1ttLm1vbnRoKCldO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9tb250aHNTaG9ydCA6IFwiSmFuX0ZlYl9NYXJfQXByX01heV9KdW5fSnVsX0F1Z19TZXBfT2N0X05vdl9EZWNcIi5zcGxpdChcIl9cIiksXHJcbiAgICAgICAgbW9udGhzU2hvcnQgOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRbbS5tb250aCgpXTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBtb250aHNQYXJzZSA6IGZ1bmN0aW9uIChtb250aE5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGksIG1vbSwgcmVnZXg7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX21vbnRoc1BhcnNlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tb250aHNQYXJzZSA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vbnRoc1BhcnNlW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9tID0gbW9tZW50LnV0YyhbMjAwMCwgaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4ID0gJ14nICsgdGhpcy5tb250aHMobW9tLCAnJykgKyAnfF4nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAocmVnZXgucmVwbGFjZSgnLicsICcnKSwgJ2knKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VbaV0udGVzdChtb250aE5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfd2Vla2RheXMgOiBcIlN1bmRheV9Nb25kYXlfVHVlc2RheV9XZWRuZXNkYXlfVGh1cnNkYXlfRnJpZGF5X1NhdHVyZGF5XCIuc3BsaXQoXCJfXCIpLFxyXG4gICAgICAgIHdlZWtkYXlzIDogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzW20uZGF5KCldO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF93ZWVrZGF5c1Nob3J0IDogXCJTdW5fTW9uX1R1ZV9XZWRfVGh1X0ZyaV9TYXRcIi5zcGxpdChcIl9cIiksXHJcbiAgICAgICAgd2Vla2RheXNTaG9ydCA6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0W20uZGF5KCldO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF93ZWVrZGF5c01pbiA6IFwiU3VfTW9fVHVfV2VfVGhfRnJfU2FcIi5zcGxpdChcIl9cIiksXHJcbiAgICAgICAgd2Vla2RheXNNaW4gOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNNaW5bbS5kYXkoKV07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgd2Vla2RheXNQYXJzZSA6IGZ1bmN0aW9uICh3ZWVrZGF5TmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgaSwgbW9tLCByZWdleDtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fd2Vla2RheXNQYXJzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZSA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fd2Vla2RheXNQYXJzZVtpXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vbSA9IG1vbWVudChbMjAwMCwgMV0pLmRheShpKTtcclxuICAgICAgICAgICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZVtpXSA9IG5ldyBSZWdFeHAocmVnZXgucmVwbGFjZSgnLicsICcnKSwgJ2knKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZVtpXS50ZXN0KHdlZWtkYXlOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2xvbmdEYXRlRm9ybWF0IDoge1xyXG4gICAgICAgICAgICBMVCA6IFwiaDptbSBBXCIsXHJcbiAgICAgICAgICAgIEwgOiBcIk1NL0REL1lZWVlcIixcclxuICAgICAgICAgICAgTEwgOiBcIk1NTU0gRCBZWVlZXCIsXHJcbiAgICAgICAgICAgIExMTCA6IFwiTU1NTSBEIFlZWVkgTFRcIixcclxuICAgICAgICAgICAgTExMTCA6IFwiZGRkZCwgTU1NTSBEIFlZWVkgTFRcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbG9uZ0RhdGVGb3JtYXQgOiBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldO1xyXG4gICAgICAgICAgICBpZiAoIW91dHB1dCAmJiB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXkudG9VcHBlckNhc2UoKV0pIHtcclxuICAgICAgICAgICAgICAgIG91dHB1dCA9IHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleS50b1VwcGVyQ2FzZSgpXS5yZXBsYWNlKC9NTU1NfE1NfEREfGRkZGQvZywgZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWwuc2xpY2UoMSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleV0gPSBvdXRwdXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc1BNIDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIC8vIElFOCBRdWlya3MgTW9kZSAmIElFNyBTdGFuZGFyZHMgTW9kZSBkbyBub3QgYWxsb3cgYWNjZXNzaW5nIHN0cmluZ3MgbGlrZSBhcnJheXNcclxuICAgICAgICAgICAgLy8gVXNpbmcgY2hhckF0IHNob3VsZCBiZSBtb3JlIGNvbXBhdGlibGUuXHJcbiAgICAgICAgICAgIHJldHVybiAoKGlucHV0ICsgJycpLnRvTG93ZXJDYXNlKCkuY2hhckF0KDApID09PSAncCcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9tZXJpZGllbVBhcnNlIDogL1thcF1cXC4/bT9cXC4/L2ksXHJcbiAgICAgICAgbWVyaWRpZW0gOiBmdW5jdGlvbiAoaG91cnMsIG1pbnV0ZXMsIGlzTG93ZXIpIHtcclxuICAgICAgICAgICAgaWYgKGhvdXJzID4gMTEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpc0xvd2VyID8gJ3BtJyA6ICdQTSc7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdhbScgOiAnQU0nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2NhbGVuZGFyIDoge1xyXG4gICAgICAgICAgICBzYW1lRGF5IDogJ1tUb2RheSBhdF0gTFQnLFxyXG4gICAgICAgICAgICBuZXh0RGF5IDogJ1tUb21vcnJvdyBhdF0gTFQnLFxyXG4gICAgICAgICAgICBuZXh0V2VlayA6ICdkZGRkIFthdF0gTFQnLFxyXG4gICAgICAgICAgICBsYXN0RGF5IDogJ1tZZXN0ZXJkYXkgYXRdIExUJyxcclxuICAgICAgICAgICAgbGFzdFdlZWsgOiAnW0xhc3RdIGRkZGQgW2F0XSBMVCcsXHJcbiAgICAgICAgICAgIHNhbWVFbHNlIDogJ0wnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjYWxlbmRhciA6IGZ1bmN0aW9uIChrZXksIG1vbSkge1xyXG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5fY2FsZW5kYXJba2V5XTtcclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBvdXRwdXQgPT09ICdmdW5jdGlvbicgPyBvdXRwdXQuYXBwbHkobW9tKSA6IG91dHB1dDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfcmVsYXRpdmVUaW1lIDoge1xyXG4gICAgICAgICAgICBmdXR1cmUgOiBcImluICVzXCIsXHJcbiAgICAgICAgICAgIHBhc3QgOiBcIiVzIGFnb1wiLFxyXG4gICAgICAgICAgICBzIDogXCJhIGZldyBzZWNvbmRzXCIsXHJcbiAgICAgICAgICAgIG0gOiBcImEgbWludXRlXCIsXHJcbiAgICAgICAgICAgIG1tIDogXCIlZCBtaW51dGVzXCIsXHJcbiAgICAgICAgICAgIGggOiBcImFuIGhvdXJcIixcclxuICAgICAgICAgICAgaGggOiBcIiVkIGhvdXJzXCIsXHJcbiAgICAgICAgICAgIGQgOiBcImEgZGF5XCIsXHJcbiAgICAgICAgICAgIGRkIDogXCIlZCBkYXlzXCIsXHJcbiAgICAgICAgICAgIE0gOiBcImEgbW9udGhcIixcclxuICAgICAgICAgICAgTU0gOiBcIiVkIG1vbnRoc1wiLFxyXG4gICAgICAgICAgICB5IDogXCJhIHllYXJcIixcclxuICAgICAgICAgICAgeXkgOiBcIiVkIHllYXJzXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbGF0aXZlVGltZSA6IGZ1bmN0aW9uIChudW1iZXIsIHdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpIHtcclxuICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX3JlbGF0aXZlVGltZVtzdHJpbmddO1xyXG4gICAgICAgICAgICByZXR1cm4gKHR5cGVvZiBvdXRwdXQgPT09ICdmdW5jdGlvbicpID9cclxuICAgICAgICAgICAgICAgIG91dHB1dChudW1iZXIsIHdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpIDpcclxuICAgICAgICAgICAgICAgIG91dHB1dC5yZXBsYWNlKC8lZC9pLCBudW1iZXIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGFzdEZ1dHVyZSA6IGZ1bmN0aW9uIChkaWZmLCBvdXRwdXQpIHtcclxuICAgICAgICAgICAgdmFyIGZvcm1hdCA9IHRoaXMuX3JlbGF0aXZlVGltZVtkaWZmID4gMCA/ICdmdXR1cmUnIDogJ3Bhc3QnXTtcclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBmb3JtYXQgPT09ICdmdW5jdGlvbicgPyBmb3JtYXQob3V0cHV0KSA6IGZvcm1hdC5yZXBsYWNlKC8lcy9pLCBvdXRwdXQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9yZGluYWwgOiBmdW5jdGlvbiAobnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vcmRpbmFsLnJlcGxhY2UoXCIlZFwiLCBudW1iZXIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX29yZGluYWwgOiBcIiVkXCIsXHJcblxyXG4gICAgICAgIHByZXBhcnNlIDogZnVuY3Rpb24gKHN0cmluZykge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RyaW5nO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBvc3Rmb3JtYXQgOiBmdW5jdGlvbiAoc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmc7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgd2VlayA6IGZ1bmN0aW9uIChtb20pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHdlZWtPZlllYXIobW9tLCB0aGlzLl93ZWVrLmRvdywgdGhpcy5fd2Vlay5kb3kpLndlZWs7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX3dlZWsgOiB7XHJcbiAgICAgICAgICAgIGRvdyA6IDAsIC8vIFN1bmRheSBpcyB0aGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrLlxyXG4gICAgICAgICAgICBkb3kgOiA2ICAvLyBUaGUgd2VlayB0aGF0IGNvbnRhaW5zIEphbiAxc3QgaXMgdGhlIGZpcnN0IHdlZWsgb2YgdGhlIHllYXIuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2ludmFsaWREYXRlOiAnSW52YWxpZCBkYXRlJyxcclxuICAgICAgICBpbnZhbGlkRGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW52YWxpZERhdGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTG9hZHMgYSBsYW5ndWFnZSBkZWZpbml0aW9uIGludG8gdGhlIGBsYW5ndWFnZXNgIGNhY2hlLiAgVGhlIGZ1bmN0aW9uXHJcbiAgICAvLyB0YWtlcyBhIGtleSBhbmQgb3B0aW9uYWxseSB2YWx1ZXMuICBJZiBub3QgaW4gdGhlIGJyb3dzZXIgYW5kIG5vIHZhbHVlc1xyXG4gICAgLy8gYXJlIHByb3ZpZGVkLCBpdCB3aWxsIGxvYWQgdGhlIGxhbmd1YWdlIGZpbGUgbW9kdWxlLiAgQXMgYSBjb252ZW5pZW5jZSxcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gYWxzbyByZXR1cm5zIHRoZSBsYW5ndWFnZSB2YWx1ZXMuXHJcbiAgICBmdW5jdGlvbiBsb2FkTGFuZyhrZXksIHZhbHVlcykge1xyXG4gICAgICAgIHZhbHVlcy5hYmJyID0ga2V5O1xyXG4gICAgICAgIGlmICghbGFuZ3VhZ2VzW2tleV0pIHtcclxuICAgICAgICAgICAgbGFuZ3VhZ2VzW2tleV0gPSBuZXcgTGFuZ3VhZ2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGFuZ3VhZ2VzW2tleV0uc2V0KHZhbHVlcyk7XHJcbiAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1trZXldO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSBhIGxhbmd1YWdlIGZyb20gdGhlIGBsYW5ndWFnZXNgIGNhY2hlLiBNb3N0bHkgdXNlZnVsIGluIHRlc3RzLlxyXG4gICAgZnVuY3Rpb24gdW5sb2FkTGFuZyhrZXkpIHtcclxuICAgICAgICBkZWxldGUgbGFuZ3VhZ2VzW2tleV07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lcyB3aGljaCBsYW5ndWFnZSBkZWZpbml0aW9uIHRvIHVzZSBhbmQgcmV0dXJucyBpdC5cclxuICAgIC8vXHJcbiAgICAvLyBXaXRoIG5vIHBhcmFtZXRlcnMsIGl0IHdpbGwgcmV0dXJuIHRoZSBnbG9iYWwgbGFuZ3VhZ2UuICBJZiB5b3VcclxuICAgIC8vIHBhc3MgaW4gYSBsYW5ndWFnZSBrZXksIHN1Y2ggYXMgJ2VuJywgaXQgd2lsbCByZXR1cm4gdGhlXHJcbiAgICAvLyBkZWZpbml0aW9uIGZvciAnZW4nLCBzbyBsb25nIGFzICdlbicgaGFzIGFscmVhZHkgYmVlbiBsb2FkZWQgdXNpbmdcclxuICAgIC8vIG1vbWVudC5sYW5nLlxyXG4gICAgZnVuY3Rpb24gZ2V0TGFuZ0RlZmluaXRpb24oa2V5KSB7XHJcbiAgICAgICAgdmFyIGkgPSAwLCBqLCBsYW5nLCBuZXh0LCBzcGxpdCxcclxuICAgICAgICAgICAgZ2V0ID0gZnVuY3Rpb24gKGspIHtcclxuICAgICAgICAgICAgICAgIGlmICghbGFuZ3VhZ2VzW2tdICYmIGhhc01vZHVsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmUoJy4vbGFuZy8nICsgayk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFuZ3VhZ2VzW2tdO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIWtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmZuLl9sYW5nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFpc0FycmF5KGtleSkpIHtcclxuICAgICAgICAgICAgLy9zaG9ydC1jaXJjdWl0IGV2ZXJ5dGhpbmcgZWxzZVxyXG4gICAgICAgICAgICBsYW5nID0gZ2V0KGtleSk7XHJcbiAgICAgICAgICAgIGlmIChsYW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFuZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBrZXkgPSBba2V5XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vcGljayB0aGUgbGFuZ3VhZ2UgZnJvbSB0aGUgYXJyYXlcclxuICAgICAgICAvL3RyeSBbJ2VuLWF1JywgJ2VuLWdiJ10gYXMgJ2VuLWF1JywgJ2VuLWdiJywgJ2VuJywgYXMgaW4gbW92ZSB0aHJvdWdoIHRoZSBsaXN0IHRyeWluZyBlYWNoXHJcbiAgICAgICAgLy9zdWJzdHJpbmcgZnJvbSBtb3N0IHNwZWNpZmljIHRvIGxlYXN0LCBidXQgbW92ZSB0byB0aGUgbmV4dCBhcnJheSBpdGVtIGlmIGl0J3MgYSBtb3JlIHNwZWNpZmljIHZhcmlhbnQgdGhhbiB0aGUgY3VycmVudCByb290XHJcbiAgICAgICAgd2hpbGUgKGkgPCBrZXkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHNwbGl0ID0gbm9ybWFsaXplTGFuZ3VhZ2Uoa2V5W2ldKS5zcGxpdCgnLScpO1xyXG4gICAgICAgICAgICBqID0gc3BsaXQubGVuZ3RoO1xyXG4gICAgICAgICAgICBuZXh0ID0gbm9ybWFsaXplTGFuZ3VhZ2Uoa2V5W2kgKyAxXSk7XHJcbiAgICAgICAgICAgIG5leHQgPSBuZXh0ID8gbmV4dC5zcGxpdCgnLScpIDogbnVsbDtcclxuICAgICAgICAgICAgd2hpbGUgKGogPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBsYW5nID0gZ2V0KHNwbGl0LnNsaWNlKDAsIGopLmpvaW4oJy0nKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGFuZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsYW5nO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5sZW5ndGggPj0gaiAmJiBjb21wYXJlQXJyYXlzKHNwbGl0LCBuZXh0LCB0cnVlKSA+PSBqIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vdGhlIG5leHQgYXJyYXkgaXRlbSBpcyBiZXR0ZXIgdGhhbiBhIHNoYWxsb3dlciBzdWJzdHJpbmcgb2YgdGhpcyBvbmVcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGotLTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBtb21lbnQuZm4uX2xhbmc7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIEZvcm1hdHRpbmdcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gcmVtb3ZlRm9ybWF0dGluZ1Rva2VucyhpbnB1dCkge1xyXG4gICAgICAgIGlmIChpbnB1dC5tYXRjaCgvXFxbW1xcc1xcU10vKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXlxcW3xcXF0kL2csIFwiXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXFxcXC9nLCBcIlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlRm9ybWF0RnVuY3Rpb24oZm9ybWF0KSB7XHJcbiAgICAgICAgdmFyIGFycmF5ID0gZm9ybWF0Lm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpLCBpLCBsZW5ndGg7XHJcblxyXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV0pIHtcclxuICAgICAgICAgICAgICAgIGFycmF5W2ldID0gZm9ybWF0VG9rZW5GdW5jdGlvbnNbYXJyYXlbaV1dO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXJyYXlbaV0gPSByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGFycmF5W2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChtb20pIHtcclxuICAgICAgICAgICAgdmFyIG91dHB1dCA9IFwiXCI7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0ICs9IGFycmF5W2ldIGluc3RhbmNlb2YgRnVuY3Rpb24gPyBhcnJheVtpXS5jYWxsKG1vbSwgZm9ybWF0KSA6IGFycmF5W2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBmb3JtYXQgZGF0ZSB1c2luZyBuYXRpdmUgZGF0ZSBvYmplY3RcclxuICAgIGZ1bmN0aW9uIGZvcm1hdE1vbWVudChtLCBmb3JtYXQpIHtcclxuXHJcbiAgICAgICAgaWYgKCFtLmlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbS5sYW5nKCkuaW52YWxpZERhdGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvcm1hdCA9IGV4cGFuZEZvcm1hdChmb3JtYXQsIG0ubGFuZygpKTtcclxuXHJcbiAgICAgICAgaWYgKCFmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XSkge1xyXG4gICAgICAgICAgICBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XSA9IG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdKG0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGV4cGFuZEZvcm1hdChmb3JtYXQsIGxhbmcpIHtcclxuICAgICAgICB2YXIgaSA9IDU7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2VucyhpbnB1dCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbGFuZy5sb25nRGF0ZUZvcm1hdChpbnB1dCkgfHwgaW5wdXQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcclxuICAgICAgICB3aGlsZSAoaSA+PSAwICYmIGxvY2FsRm9ybWF0dGluZ1Rva2Vucy50ZXN0KGZvcm1hdCkpIHtcclxuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UobG9jYWxGb3JtYXR0aW5nVG9rZW5zLCByZXBsYWNlTG9uZ0RhdGVGb3JtYXRUb2tlbnMpO1xyXG4gICAgICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcclxuICAgICAgICAgICAgaSAtPSAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZvcm1hdDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIFBhcnNpbmdcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgLy8gZ2V0IHRoZSByZWdleCB0byBmaW5kIHRoZSBuZXh0IHRva2VuXHJcbiAgICBmdW5jdGlvbiBnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4odG9rZW4sIGNvbmZpZykge1xyXG4gICAgICAgIHZhciBhLCBzdHJpY3QgPSBjb25maWcuX3N0cmljdDtcclxuICAgICAgICBzd2l0Y2ggKHRva2VuKSB7XHJcbiAgICAgICAgY2FzZSAnUSc6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT25lRGlnaXQ7XHJcbiAgICAgICAgY2FzZSAnRERERCc6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuVGhyZWVEaWdpdHM7XHJcbiAgICAgICAgY2FzZSAnWVlZWSc6XHJcbiAgICAgICAgY2FzZSAnR0dHRyc6XHJcbiAgICAgICAgY2FzZSAnZ2dnZyc6XHJcbiAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBwYXJzZVRva2VuRm91ckRpZ2l0cyA6IHBhcnNlVG9rZW5PbmVUb0ZvdXJEaWdpdHM7XHJcbiAgICAgICAgY2FzZSAnWSc6XHJcbiAgICAgICAgY2FzZSAnRyc6XHJcbiAgICAgICAgY2FzZSAnZyc6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuU2lnbmVkTnVtYmVyO1xyXG4gICAgICAgIGNhc2UgJ1lZWVlZWSc6XHJcbiAgICAgICAgY2FzZSAnWVlZWVknOlxyXG4gICAgICAgIGNhc2UgJ0dHR0dHJzpcclxuICAgICAgICBjYXNlICdnZ2dnZyc6XHJcbiAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBwYXJzZVRva2VuU2l4RGlnaXRzIDogcGFyc2VUb2tlbk9uZVRvU2l4RGlnaXRzO1xyXG4gICAgICAgIGNhc2UgJ1MnOlxyXG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7IHJldHVybiBwYXJzZVRva2VuT25lRGlnaXQ7IH1cclxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xyXG4gICAgICAgIGNhc2UgJ1NTJzpcclxuICAgICAgICAgICAgaWYgKHN0cmljdCkgeyByZXR1cm4gcGFyc2VUb2tlblR3b0RpZ2l0czsgfVxyXG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgY2FzZSAnU1NTJzpcclxuICAgICAgICAgICAgaWYgKHN0cmljdCkgeyByZXR1cm4gcGFyc2VUb2tlblRocmVlRGlnaXRzOyB9XHJcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICBjYXNlICdEREQnOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbk9uZVRvVGhyZWVEaWdpdHM7XHJcbiAgICAgICAgY2FzZSAnTU1NJzpcclxuICAgICAgICBjYXNlICdNTU1NJzpcclxuICAgICAgICBjYXNlICdkZCc6XHJcbiAgICAgICAgY2FzZSAnZGRkJzpcclxuICAgICAgICBjYXNlICdkZGRkJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5Xb3JkO1xyXG4gICAgICAgIGNhc2UgJ2EnOlxyXG4gICAgICAgIGNhc2UgJ0EnOlxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKS5fbWVyaWRpZW1QYXJzZTtcclxuICAgICAgICBjYXNlICdYJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaW1lc3RhbXBNcztcclxuICAgICAgICBjYXNlICdaJzpcclxuICAgICAgICBjYXNlICdaWic6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuVGltZXpvbmU7XHJcbiAgICAgICAgY2FzZSAnVCc6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuVDtcclxuICAgICAgICBjYXNlICdTU1NTJzpcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5EaWdpdHM7XHJcbiAgICAgICAgY2FzZSAnTU0nOlxyXG4gICAgICAgIGNhc2UgJ0REJzpcclxuICAgICAgICBjYXNlICdZWSc6XHJcbiAgICAgICAgY2FzZSAnR0cnOlxyXG4gICAgICAgIGNhc2UgJ2dnJzpcclxuICAgICAgICBjYXNlICdISCc6XHJcbiAgICAgICAgY2FzZSAnaGgnOlxyXG4gICAgICAgIGNhc2UgJ21tJzpcclxuICAgICAgICBjYXNlICdzcyc6XHJcbiAgICAgICAgY2FzZSAnd3cnOlxyXG4gICAgICAgIGNhc2UgJ1dXJzpcclxuICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IHBhcnNlVG9rZW5Ud29EaWdpdHMgOiBwYXJzZVRva2VuT25lT3JUd29EaWdpdHM7XHJcbiAgICAgICAgY2FzZSAnTSc6XHJcbiAgICAgICAgY2FzZSAnRCc6XHJcbiAgICAgICAgY2FzZSAnZCc6XHJcbiAgICAgICAgY2FzZSAnSCc6XHJcbiAgICAgICAgY2FzZSAnaCc6XHJcbiAgICAgICAgY2FzZSAnbSc6XHJcbiAgICAgICAgY2FzZSAncyc6XHJcbiAgICAgICAgY2FzZSAndyc6XHJcbiAgICAgICAgY2FzZSAnVyc6XHJcbiAgICAgICAgY2FzZSAnZSc6XHJcbiAgICAgICAgY2FzZSAnRSc6XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT25lT3JUd29EaWdpdHM7XHJcbiAgICAgICAgY2FzZSAnRG8nOlxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbk9yZGluYWw7XHJcbiAgICAgICAgZGVmYXVsdCA6XHJcbiAgICAgICAgICAgIGEgPSBuZXcgUmVnRXhwKHJlZ2V4cEVzY2FwZSh1bmVzY2FwZUZvcm1hdCh0b2tlbi5yZXBsYWNlKCdcXFxcJywgJycpKSwgXCJpXCIpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGE7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRpbWV6b25lTWludXRlc0Zyb21TdHJpbmcoc3RyaW5nKSB7XHJcbiAgICAgICAgc3RyaW5nID0gc3RyaW5nIHx8IFwiXCI7XHJcbiAgICAgICAgdmFyIHBvc3NpYmxlVHpNYXRjaGVzID0gKHN0cmluZy5tYXRjaChwYXJzZVRva2VuVGltZXpvbmUpIHx8IFtdKSxcclxuICAgICAgICAgICAgdHpDaHVuayA9IHBvc3NpYmxlVHpNYXRjaGVzW3Bvc3NpYmxlVHpNYXRjaGVzLmxlbmd0aCAtIDFdIHx8IFtdLFxyXG4gICAgICAgICAgICBwYXJ0cyA9ICh0ekNodW5rICsgJycpLm1hdGNoKHBhcnNlVGltZXpvbmVDaHVua2VyKSB8fCBbJy0nLCAwLCAwXSxcclxuICAgICAgICAgICAgbWludXRlcyA9ICsocGFydHNbMV0gKiA2MCkgKyB0b0ludChwYXJ0c1syXSk7XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJ0c1swXSA9PT0gJysnID8gLW1pbnV0ZXMgOiBtaW51dGVzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZ1bmN0aW9uIHRvIGNvbnZlcnQgc3RyaW5nIGlucHV0IHRvIGRhdGVcclxuICAgIGZ1bmN0aW9uIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBpbnB1dCwgY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIGEsIGRhdGVQYXJ0QXJyYXkgPSBjb25maWcuX2E7XHJcblxyXG4gICAgICAgIHN3aXRjaCAodG9rZW4pIHtcclxuICAgICAgICAvLyBRVUFSVEVSXHJcbiAgICAgICAgY2FzZSAnUSc6XHJcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W01PTlRIXSA9ICh0b0ludChpbnB1dCkgLSAxKSAqIDM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gTU9OVEhcclxuICAgICAgICBjYXNlICdNJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBNTVxyXG4gICAgICAgIGNhc2UgJ01NJyA6XHJcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W01PTlRIXSA9IHRvSW50KGlucHV0KSAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnTU1NJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBNTU1NXHJcbiAgICAgICAgY2FzZSAnTU1NTScgOlxyXG4gICAgICAgICAgICBhID0gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKS5tb250aHNQYXJzZShpbnB1dCk7XHJcbiAgICAgICAgICAgIC8vIGlmIHdlIGRpZG4ndCBmaW5kIGEgbW9udGggbmFtZSwgbWFyayB0aGUgZGF0ZSBhcyBpbnZhbGlkLlxyXG4gICAgICAgICAgICBpZiAoYSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W01PTlRIXSA9IGE7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcuX3BmLmludmFsaWRNb250aCA9IGlucHV0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIERBWSBPRiBNT05USFxyXG4gICAgICAgIGNhc2UgJ0QnIDogLy8gZmFsbCB0aHJvdWdoIHRvIEREXHJcbiAgICAgICAgY2FzZSAnREQnIDpcclxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbREFURV0gPSB0b0ludChpbnB1dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnRG8nIDpcclxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbREFURV0gPSB0b0ludChwYXJzZUludChpbnB1dCwgMTApKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBEQVkgT0YgWUVBUlxyXG4gICAgICAgIGNhc2UgJ0RERCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gRERERFxyXG4gICAgICAgIGNhc2UgJ0REREQnIDpcclxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5fZGF5T2ZZZWFyID0gdG9JbnQoaW5wdXQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBZRUFSXHJcbiAgICAgICAgY2FzZSAnWVknIDpcclxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtZRUFSXSA9IG1vbWVudC5wYXJzZVR3b0RpZ2l0WWVhcihpbnB1dCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ1lZWVknIDpcclxuICAgICAgICBjYXNlICdZWVlZWScgOlxyXG4gICAgICAgIGNhc2UgJ1lZWVlZWScgOlxyXG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W1lFQVJdID0gdG9JbnQoaW5wdXQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBBTSAvIFBNXHJcbiAgICAgICAgY2FzZSAnYScgOiAvLyBmYWxsIHRocm91Z2ggdG8gQVxyXG4gICAgICAgIGNhc2UgJ0EnIDpcclxuICAgICAgICAgICAgY29uZmlnLl9pc1BtID0gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKS5pc1BNKGlucHV0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gMjQgSE9VUlxyXG4gICAgICAgIGNhc2UgJ0gnIDogLy8gZmFsbCB0aHJvdWdoIHRvIGhoXHJcbiAgICAgICAgY2FzZSAnSEgnIDogLy8gZmFsbCB0aHJvdWdoIHRvIGhoXHJcbiAgICAgICAgY2FzZSAnaCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gaGhcclxuICAgICAgICBjYXNlICdoaCcgOlxyXG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAvLyBNSU5VVEVcclxuICAgICAgICBjYXNlICdtJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBtbVxyXG4gICAgICAgIGNhc2UgJ21tJyA6XHJcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gU0VDT05EXHJcbiAgICAgICAgY2FzZSAncycgOiAvLyBmYWxsIHRocm91Z2ggdG8gc3NcclxuICAgICAgICBjYXNlICdzcycgOlxyXG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W1NFQ09ORF0gPSB0b0ludChpbnB1dCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIE1JTExJU0VDT05EXHJcbiAgICAgICAgY2FzZSAnUycgOlxyXG4gICAgICAgIGNhc2UgJ1NTJyA6XHJcbiAgICAgICAgY2FzZSAnU1NTJyA6XHJcbiAgICAgICAgY2FzZSAnU1NTUycgOlxyXG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W01JTExJU0VDT05EXSA9IHRvSW50KCgnMC4nICsgaW5wdXQpICogMTAwMCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIFVOSVggVElNRVNUQU1QIFdJVEggTVNcclxuICAgICAgICBjYXNlICdYJzpcclxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUocGFyc2VGbG9hdChpbnB1dCkgKiAxMDAwKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gVElNRVpPTkVcclxuICAgICAgICBjYXNlICdaJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBaWlxyXG4gICAgICAgIGNhc2UgJ1paJyA6XHJcbiAgICAgICAgICAgIGNvbmZpZy5fdXNlVVRDID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uZmlnLl90em0gPSB0aW1lem9uZU1pbnV0ZXNGcm9tU3RyaW5nKGlucHV0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgLy8gV0VFS0RBWSAtIGh1bWFuXHJcbiAgICAgICAgY2FzZSAnZGQnOlxyXG4gICAgICAgIGNhc2UgJ2RkZCc6XHJcbiAgICAgICAgY2FzZSAnZGRkZCc6XHJcbiAgICAgICAgICAgIGEgPSBnZXRMYW5nRGVmaW5pdGlvbihjb25maWcuX2wpLndlZWtkYXlzUGFyc2UoaW5wdXQpO1xyXG4gICAgICAgICAgICAvLyBpZiB3ZSBkaWRuJ3QgZ2V0IGEgd2Vla2RheSBuYW1lLCBtYXJrIHRoZSBkYXRlIGFzIGludmFsaWRcclxuICAgICAgICAgICAgaWYgKGEgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLl93WydkJ10gPSBhO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi5pbnZhbGlkV2Vla2RheSA9IGlucHV0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIC8vIFdFRUssIFdFRUsgREFZIC0gbnVtZXJpY1xyXG4gICAgICAgIGNhc2UgJ3cnOlxyXG4gICAgICAgIGNhc2UgJ3d3JzpcclxuICAgICAgICBjYXNlICdXJzpcclxuICAgICAgICBjYXNlICdXVyc6XHJcbiAgICAgICAgY2FzZSAnZCc6XHJcbiAgICAgICAgY2FzZSAnZSc6XHJcbiAgICAgICAgY2FzZSAnRSc6XHJcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW4uc3Vic3RyKDAsIDEpO1xyXG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgY2FzZSAnZ2dnZyc6XHJcbiAgICAgICAgY2FzZSAnR0dHRyc6XHJcbiAgICAgICAgY2FzZSAnR0dHR0cnOlxyXG4gICAgICAgICAgICB0b2tlbiA9IHRva2VuLnN1YnN0cigwLCAyKTtcclxuICAgICAgICAgICAgaWYgKGlucHV0KSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcuX3cgPSBjb25maWcuX3cgfHwge307XHJcbiAgICAgICAgICAgICAgICBjb25maWcuX3dbdG9rZW5dID0gdG9JbnQoaW5wdXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2dnJzpcclxuICAgICAgICBjYXNlICdHRyc6XHJcbiAgICAgICAgICAgIGNvbmZpZy5fdyA9IGNvbmZpZy5fdyB8fCB7fTtcclxuICAgICAgICAgICAgY29uZmlnLl93W3Rva2VuXSA9IG1vbWVudC5wYXJzZVR3b0RpZ2l0WWVhcihpbnB1dCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRheU9mWWVhckZyb21XZWVrSW5mbyhjb25maWcpIHtcclxuICAgICAgICB2YXIgdywgd2Vla1llYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95LCB0ZW1wLCBsYW5nO1xyXG5cclxuICAgICAgICB3ID0gY29uZmlnLl93O1xyXG4gICAgICAgIGlmICh3LkdHICE9IG51bGwgfHwgdy5XICE9IG51bGwgfHwgdy5FICE9IG51bGwpIHtcclxuICAgICAgICAgICAgZG93ID0gMTtcclxuICAgICAgICAgICAgZG95ID0gNDtcclxuXHJcbiAgICAgICAgICAgIC8vIFRPRE86IFdlIG5lZWQgdG8gdGFrZSB0aGUgY3VycmVudCBpc29XZWVrWWVhciwgYnV0IHRoYXQgZGVwZW5kcyBvblxyXG4gICAgICAgICAgICAvLyBob3cgd2UgaW50ZXJwcmV0IG5vdyAobG9jYWwsIHV0YywgZml4ZWQgb2Zmc2V0KS4gU28gY3JlYXRlXHJcbiAgICAgICAgICAgIC8vIGEgbm93IHZlcnNpb24gb2YgY3VycmVudCBjb25maWcgKHRha2UgbG9jYWwvdXRjL29mZnNldCBmbGFncywgYW5kXHJcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBub3cpLlxyXG4gICAgICAgICAgICB3ZWVrWWVhciA9IGRmbCh3LkdHLCBjb25maWcuX2FbWUVBUl0sIHdlZWtPZlllYXIobW9tZW50KCksIDEsIDQpLnllYXIpO1xyXG4gICAgICAgICAgICB3ZWVrID0gZGZsKHcuVywgMSk7XHJcbiAgICAgICAgICAgIHdlZWtkYXkgPSBkZmwody5FLCAxKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYW5nID0gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKTtcclxuICAgICAgICAgICAgZG93ID0gbGFuZy5fd2Vlay5kb3c7XHJcbiAgICAgICAgICAgIGRveSA9IGxhbmcuX3dlZWsuZG95O1xyXG5cclxuICAgICAgICAgICAgd2Vla1llYXIgPSBkZmwody5nZywgY29uZmlnLl9hW1lFQVJdLCB3ZWVrT2ZZZWFyKG1vbWVudCgpLCBkb3csIGRveSkueWVhcik7XHJcbiAgICAgICAgICAgIHdlZWsgPSBkZmwody53LCAxKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh3LmQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgLy8gd2Vla2RheSAtLSBsb3cgZGF5IG51bWJlcnMgYXJlIGNvbnNpZGVyZWQgbmV4dCB3ZWVrXHJcbiAgICAgICAgICAgICAgICB3ZWVrZGF5ID0gdy5kO1xyXG4gICAgICAgICAgICAgICAgaWYgKHdlZWtkYXkgPCBkb3cpIHtcclxuICAgICAgICAgICAgICAgICAgICArK3dlZWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAody5lICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIC8vIGxvY2FsIHdlZWtkYXkgLS0gY291bnRpbmcgc3RhcnRzIGZyb20gYmVnaW5pbmcgb2Ygd2Vla1xyXG4gICAgICAgICAgICAgICAgd2Vla2RheSA9IHcuZSArIGRvdztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGRlZmF1bHQgdG8gYmVnaW5pbmcgb2Ygd2Vla1xyXG4gICAgICAgICAgICAgICAgd2Vla2RheSA9IGRvdztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0ZW1wID0gZGF5T2ZZZWFyRnJvbVdlZWtzKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3ksIGRvdyk7XHJcblxyXG4gICAgICAgIGNvbmZpZy5fYVtZRUFSXSA9IHRlbXAueWVhcjtcclxuICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRlbXAuZGF5T2ZZZWFyO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbnZlcnQgYW4gYXJyYXkgdG8gYSBkYXRlLlxyXG4gICAgLy8gdGhlIGFycmF5IHNob3VsZCBtaXJyb3IgdGhlIHBhcmFtZXRlcnMgYmVsb3dcclxuICAgIC8vIG5vdGU6IGFsbCB2YWx1ZXMgcGFzdCB0aGUgeWVhciBhcmUgb3B0aW9uYWwgYW5kIHdpbGwgZGVmYXVsdCB0byB0aGUgbG93ZXN0IHBvc3NpYmxlIHZhbHVlLlxyXG4gICAgLy8gW3llYXIsIG1vbnRoLCBkYXkgLCBob3VyLCBtaW51dGUsIHNlY29uZCwgbWlsbGlzZWNvbmRdXHJcbiAgICBmdW5jdGlvbiBkYXRlRnJvbUNvbmZpZyhjb25maWcpIHtcclxuICAgICAgICB2YXIgaSwgZGF0ZSwgaW5wdXQgPSBbXSwgY3VycmVudERhdGUsIHllYXJUb1VzZTtcclxuXHJcbiAgICAgICAgaWYgKGNvbmZpZy5fZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdXJyZW50RGF0ZSA9IGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKTtcclxuXHJcbiAgICAgICAgLy9jb21wdXRlIGRheSBvZiB0aGUgeWVhciBmcm9tIHdlZWtzIGFuZCB3ZWVrZGF5c1xyXG4gICAgICAgIGlmIChjb25maWcuX3cgJiYgY29uZmlnLl9hW0RBVEVdID09IG51bGwgJiYgY29uZmlnLl9hW01PTlRIXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGRheU9mWWVhckZyb21XZWVrSW5mbyhjb25maWcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9pZiB0aGUgZGF5IG9mIHRoZSB5ZWFyIGlzIHNldCwgZmlndXJlIG91dCB3aGF0IGl0IGlzXHJcbiAgICAgICAgaWYgKGNvbmZpZy5fZGF5T2ZZZWFyKSB7XHJcbiAgICAgICAgICAgIHllYXJUb1VzZSA9IGRmbChjb25maWcuX2FbWUVBUl0sIGN1cnJlbnREYXRlW1lFQVJdKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhciA+IGRheXNJblllYXIoeWVhclRvVXNlKSkge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi5fb3ZlcmZsb3dEYXlPZlllYXIgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkYXRlID0gbWFrZVVUQ0RhdGUoeWVhclRvVXNlLCAwLCBjb25maWcuX2RheU9mWWVhcik7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fYVtNT05USF0gPSBkYXRlLmdldFVUQ01vbnRoKCk7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fYVtEQVRFXSA9IGRhdGUuZ2V0VVRDRGF0ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGVmYXVsdCB0byBjdXJyZW50IGRhdGUuXHJcbiAgICAgICAgLy8gKiBpZiBubyB5ZWFyLCBtb250aCwgZGF5IG9mIG1vbnRoIGFyZSBnaXZlbiwgZGVmYXVsdCB0byB0b2RheVxyXG4gICAgICAgIC8vICogaWYgZGF5IG9mIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG1vbnRoIGFuZCB5ZWFyXHJcbiAgICAgICAgLy8gKiBpZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBvbmx5IHllYXJcclxuICAgICAgICAvLyAqIGlmIHllYXIgaXMgZ2l2ZW4sIGRvbid0IGRlZmF1bHQgYW55dGhpbmdcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMyAmJiBjb25maWcuX2FbaV0gPT0gbnVsbDsgKytpKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gY3VycmVudERhdGVbaV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBaZXJvIG91dCB3aGF0ZXZlciB3YXMgbm90IGRlZmF1bHRlZCwgaW5jbHVkaW5nIHRpbWVcclxuICAgICAgICBmb3IgKDsgaSA8IDc7IGkrKykge1xyXG4gICAgICAgICAgICBjb25maWcuX2FbaV0gPSBpbnB1dFtpXSA9IChjb25maWcuX2FbaV0gPT0gbnVsbCkgPyAoaSA9PT0gMiA/IDEgOiAwKSA6IGNvbmZpZy5fYVtpXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbmZpZy5fZCA9IChjb25maWcuX3VzZVVUQyA/IG1ha2VVVENEYXRlIDogbWFrZURhdGUpLmFwcGx5KG51bGwsIGlucHV0KTtcclxuICAgICAgICAvLyBBcHBseSB0aW1lem9uZSBvZmZzZXQgZnJvbSBpbnB1dC4gVGhlIGFjdHVhbCB6b25lIGNhbiBiZSBjaGFuZ2VkXHJcbiAgICAgICAgLy8gd2l0aCBwYXJzZVpvbmUuXHJcbiAgICAgICAgaWYgKGNvbmZpZy5fdHptICE9IG51bGwpIHtcclxuICAgICAgICAgICAgY29uZmlnLl9kLnNldFVUQ01pbnV0ZXMoY29uZmlnLl9kLmdldFVUQ01pbnV0ZXMoKSArIGNvbmZpZy5fdHptKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGF0ZUZyb21PYmplY3QoY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIG5vcm1hbGl6ZWRJbnB1dDtcclxuXHJcbiAgICAgICAgaWYgKGNvbmZpZy5fZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVPYmplY3RVbml0cyhjb25maWcuX2kpO1xyXG4gICAgICAgIGNvbmZpZy5fYSA9IFtcclxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0LnllYXIsXHJcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5tb250aCxcclxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0LmRheSxcclxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0LmhvdXIsXHJcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5taW51dGUsXHJcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5zZWNvbmQsXHJcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5taWxsaXNlY29uZFxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGRhdGVGcm9tQ29uZmlnKGNvbmZpZyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY3VycmVudERhdGVBcnJheShjb25maWcpIHtcclxuICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcclxuICAgICAgICBpZiAoY29uZmlnLl91c2VVVEMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICAgICAgbm93LmdldFVUQ01vbnRoKCksXHJcbiAgICAgICAgICAgICAgICBub3cuZ2V0VVRDRGF0ZSgpXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtub3cuZ2V0RnVsbFllYXIoKSwgbm93LmdldE1vbnRoKCksIG5vdy5nZXREYXRlKCldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBkYXRlIGZyb20gc3RyaW5nIGFuZCBmb3JtYXQgc3RyaW5nXHJcbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKSB7XHJcblxyXG4gICAgICAgIGlmIChjb25maWcuX2YgPT09IG1vbWVudC5JU09fODYwMSkge1xyXG4gICAgICAgICAgICBwYXJzZUlTTyhjb25maWcpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25maWcuX2EgPSBbXTtcclxuICAgICAgICBjb25maWcuX3BmLmVtcHR5ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8gVGhpcyBhcnJheSBpcyB1c2VkIHRvIG1ha2UgYSBEYXRlLCBlaXRoZXIgd2l0aCBgbmV3IERhdGVgIG9yIGBEYXRlLlVUQ2BcclxuICAgICAgICB2YXIgbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCksXHJcbiAgICAgICAgICAgIHN0cmluZyA9ICcnICsgY29uZmlnLl9pLFxyXG4gICAgICAgICAgICBpLCBwYXJzZWRJbnB1dCwgdG9rZW5zLCB0b2tlbiwgc2tpcHBlZCxcclxuICAgICAgICAgICAgc3RyaW5nTGVuZ3RoID0gc3RyaW5nLmxlbmd0aCxcclxuICAgICAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgIHRva2VucyA9IGV4cGFuZEZvcm1hdChjb25maWcuX2YsIGxhbmcpLm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpIHx8IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xyXG4gICAgICAgICAgICBwYXJzZWRJbnB1dCA9IChzdHJpbmcubWF0Y2goZ2V0UGFyc2VSZWdleEZvclRva2VuKHRva2VuLCBjb25maWcpKSB8fCBbXSlbMF07XHJcbiAgICAgICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xyXG4gICAgICAgICAgICAgICAgc2tpcHBlZCA9IHN0cmluZy5zdWJzdHIoMCwgc3RyaW5nLmluZGV4T2YocGFyc2VkSW5wdXQpKTtcclxuICAgICAgICAgICAgICAgIGlmIChza2lwcGVkLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZElucHV0LnB1c2goc2tpcHBlZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcuc2xpY2Uoc3RyaW5nLmluZGV4T2YocGFyc2VkSW5wdXQpICsgcGFyc2VkSW5wdXQubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGggKz0gcGFyc2VkSW5wdXQubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGRvbid0IHBhcnNlIGlmIGl0J3Mgbm90IGEga25vd24gdG9rZW5cclxuICAgICAgICAgICAgaWYgKGZvcm1hdFRva2VuRnVuY3Rpb25zW3Rva2VuXSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLl9wZi5lbXB0eSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLl9wZi51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgcGFyc2VkSW5wdXQsIGNvbmZpZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoY29uZmlnLl9zdHJpY3QgJiYgIXBhcnNlZElucHV0KSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gYWRkIHJlbWFpbmluZyB1bnBhcnNlZCBpbnB1dCBsZW5ndGggdG8gdGhlIHN0cmluZ1xyXG4gICAgICAgIGNvbmZpZy5fcGYuY2hhcnNMZWZ0T3ZlciA9IHN0cmluZ0xlbmd0aCAtIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGg7XHJcbiAgICAgICAgaWYgKHN0cmluZy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fcGYudW51c2VkSW5wdXQucHVzaChzdHJpbmcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaGFuZGxlIGFtIHBtXHJcbiAgICAgICAgaWYgKGNvbmZpZy5faXNQbSAmJiBjb25maWcuX2FbSE9VUl0gPCAxMikge1xyXG4gICAgICAgICAgICBjb25maWcuX2FbSE9VUl0gKz0gMTI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGlmIGlzIDEyIGFtLCBjaGFuZ2UgaG91cnMgdG8gMFxyXG4gICAgICAgIGlmIChjb25maWcuX2lzUG0gPT09IGZhbHNlICYmIGNvbmZpZy5fYVtIT1VSXSA9PT0gMTIpIHtcclxuICAgICAgICAgICAgY29uZmlnLl9hW0hPVVJdID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRhdGVGcm9tQ29uZmlnKGNvbmZpZyk7XHJcbiAgICAgICAgY2hlY2tPdmVyZmxvdyhjb25maWcpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVuZXNjYXBlRm9ybWF0KHMpIHtcclxuICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9cXFxcKFxcWyl8XFxcXChcXF0pfFxcWyhbXlxcXVxcW10qKVxcXXxcXFxcKC4pL2csIGZ1bmN0aW9uIChtYXRjaGVkLCBwMSwgcDIsIHAzLCBwNCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcDEgfHwgcDIgfHwgcDMgfHwgcDQ7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29kZSBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzU2MTQ5My9pcy10aGVyZS1hLXJlZ2V4cC1lc2NhcGUtZnVuY3Rpb24taW4tamF2YXNjcmlwdFxyXG4gICAgZnVuY3Rpb24gcmVnZXhwRXNjYXBlKHMpIHtcclxuICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csICdcXFxcJCYnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBkYXRlIGZyb20gc3RyaW5nIGFuZCBhcnJheSBvZiBmb3JtYXQgc3RyaW5nc1xyXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tU3RyaW5nQW5kQXJyYXkoY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIHRlbXBDb25maWcsXHJcbiAgICAgICAgICAgIGJlc3RNb21lbnQsXHJcblxyXG4gICAgICAgICAgICBzY29yZVRvQmVhdCxcclxuICAgICAgICAgICAgaSxcclxuICAgICAgICAgICAgY3VycmVudFNjb3JlO1xyXG5cclxuICAgICAgICBpZiAoY29uZmlnLl9mLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb25maWcuX3BmLmludmFsaWRGb3JtYXQgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShOYU4pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY29uZmlnLl9mLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZSA9IDA7XHJcbiAgICAgICAgICAgIHRlbXBDb25maWcgPSBleHRlbmQoe30sIGNvbmZpZyk7XHJcbiAgICAgICAgICAgIHRlbXBDb25maWcuX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xyXG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9mID0gY29uZmlnLl9mW2ldO1xyXG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21TdHJpbmdBbmRGb3JtYXQodGVtcENvbmZpZyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzVmFsaWQodGVtcENvbmZpZykpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBhbnkgaW5wdXQgdGhhdCB3YXMgbm90IHBhcnNlZCBhZGQgYSBwZW5hbHR5IGZvciB0aGF0IGZvcm1hdFxyXG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgKz0gdGVtcENvbmZpZy5fcGYuY2hhcnNMZWZ0T3ZlcjtcclxuXHJcbiAgICAgICAgICAgIC8vb3IgdG9rZW5zXHJcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZSArPSB0ZW1wQ29uZmlnLl9wZi51bnVzZWRUb2tlbnMubGVuZ3RoICogMTA7XHJcblxyXG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9wZi5zY29yZSA9IGN1cnJlbnRTY29yZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzY29yZVRvQmVhdCA9PSBudWxsIHx8IGN1cnJlbnRTY29yZSA8IHNjb3JlVG9CZWF0KSB7XHJcbiAgICAgICAgICAgICAgICBzY29yZVRvQmVhdCA9IGN1cnJlbnRTY29yZTtcclxuICAgICAgICAgICAgICAgIGJlc3RNb21lbnQgPSB0ZW1wQ29uZmlnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQoY29uZmlnLCBiZXN0TW9tZW50IHx8IHRlbXBDb25maWcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRhdGUgZnJvbSBpc28gZm9ybWF0XHJcbiAgICBmdW5jdGlvbiBwYXJzZUlTTyhjb25maWcpIHtcclxuICAgICAgICB2YXIgaSwgbCxcclxuICAgICAgICAgICAgc3RyaW5nID0gY29uZmlnLl9pLFxyXG4gICAgICAgICAgICBtYXRjaCA9IGlzb1JlZ2V4LmV4ZWMoc3RyaW5nKTtcclxuXHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fcGYuaXNvID0gdHJ1ZTtcclxuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb0RhdGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzb0RhdGVzW2ldWzFdLmV4ZWMoc3RyaW5nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1hdGNoWzVdIHNob3VsZCBiZSBcIlRcIiBvciB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgICAgICBjb25maWcuX2YgPSBpc29EYXRlc1tpXVswXSArIChtYXRjaFs2XSB8fCBcIiBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb1RpbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzb1RpbWVzW2ldWzFdLmV4ZWMoc3RyaW5nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fZiArPSBpc29UaW1lc1tpXVswXTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3RyaW5nLm1hdGNoKHBhcnNlVG9rZW5UaW1lem9uZSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5fZiArPSBcIlpcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGF0ZSBmcm9tIGlzbyBmb3JtYXQgb3IgZmFsbGJhY2tcclxuICAgIGZ1bmN0aW9uIG1ha2VEYXRlRnJvbVN0cmluZyhjb25maWcpIHtcclxuICAgICAgICBwYXJzZUlTTyhjb25maWcpO1xyXG4gICAgICAgIGlmIChjb25maWcuX2lzVmFsaWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBjb25maWcuX2lzVmFsaWQ7XHJcbiAgICAgICAgICAgIG1vbWVudC5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21JbnB1dChjb25maWcpIHtcclxuICAgICAgICB2YXIgaW5wdXQgPSBjb25maWcuX2ksXHJcbiAgICAgICAgICAgIG1hdGNoZWQgPSBhc3BOZXRKc29uUmVnZXguZXhlYyhpbnB1dCk7XHJcblxyXG4gICAgICAgIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChtYXRjaGVkKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKCttYXRjaGVkWzFdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nKGNvbmZpZyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpc0FycmF5KGlucHV0KSkge1xyXG4gICAgICAgICAgICBjb25maWcuX2EgPSBpbnB1dC5zbGljZSgwKTtcclxuICAgICAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGlzRGF0ZShpbnB1dCkpIHtcclxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoK2lucHV0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZihpbnB1dCkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIGRhdGVGcm9tT2JqZWN0KGNvbmZpZyk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YoaW5wdXQpID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAvLyBmcm9tIG1pbGxpc2Vjb25kc1xyXG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShpbnB1dCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbW9tZW50LmNyZWF0ZUZyb21JbnB1dEZhbGxiYWNrKGNvbmZpZyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VEYXRlKHksIG0sIGQsIGgsIE0sIHMsIG1zKSB7XHJcbiAgICAgICAgLy9jYW4ndCBqdXN0IGFwcGx5KCkgdG8gY3JlYXRlIGEgZGF0ZTpcclxuICAgICAgICAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTgxMzQ4L2luc3RhbnRpYXRpbmctYS1qYXZhc2NyaXB0LW9iamVjdC1ieS1jYWxsaW5nLXByb3RvdHlwZS1jb25zdHJ1Y3Rvci1hcHBseVxyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoeSwgbSwgZCwgaCwgTSwgcywgbXMpO1xyXG5cclxuICAgICAgICAvL3RoZSBkYXRlIGNvbnN0cnVjdG9yIGRvZXNuJ3QgYWNjZXB0IHllYXJzIDwgMTk3MFxyXG4gICAgICAgIGlmICh5IDwgMTk3MCkge1xyXG4gICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlVVRDRGF0ZSh5KSB7XHJcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShEYXRlLlVUQy5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcclxuICAgICAgICBpZiAoeSA8IDE5NzApIHtcclxuICAgICAgICAgICAgZGF0ZS5zZXRVVENGdWxsWWVhcih5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRhdGU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VXZWVrZGF5KGlucHV0LCBsYW5ndWFnZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGlmICghaXNOYU4oaW5wdXQpKSB7XHJcbiAgICAgICAgICAgICAgICBpbnB1dCA9IHBhcnNlSW50KGlucHV0LCAxMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpbnB1dCA9IGxhbmd1YWdlLndlZWtkYXlzUGFyc2UoaW5wdXQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaW5wdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIFJlbGF0aXZlIFRpbWVcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBtb21lbnQuZm4uZnJvbSwgbW9tZW50LmZuLmZyb21Ob3csIGFuZCBtb21lbnQuZHVyYXRpb24uZm4uaHVtYW5pemVcclxuICAgIGZ1bmN0aW9uIHN1YnN0aXR1dGVUaW1lQWdvKHN0cmluZywgbnVtYmVyLCB3aXRob3V0U3VmZml4LCBpc0Z1dHVyZSwgbGFuZykge1xyXG4gICAgICAgIHJldHVybiBsYW5nLnJlbGF0aXZlVGltZShudW1iZXIgfHwgMSwgISF3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZWxhdGl2ZVRpbWUobWlsbGlzZWNvbmRzLCB3aXRob3V0U3VmZml4LCBsYW5nKSB7XHJcbiAgICAgICAgdmFyIHNlY29uZHMgPSByb3VuZChNYXRoLmFicyhtaWxsaXNlY29uZHMpIC8gMTAwMCksXHJcbiAgICAgICAgICAgIG1pbnV0ZXMgPSByb3VuZChzZWNvbmRzIC8gNjApLFxyXG4gICAgICAgICAgICBob3VycyA9IHJvdW5kKG1pbnV0ZXMgLyA2MCksXHJcbiAgICAgICAgICAgIGRheXMgPSByb3VuZChob3VycyAvIDI0KSxcclxuICAgICAgICAgICAgeWVhcnMgPSByb3VuZChkYXlzIC8gMzY1KSxcclxuICAgICAgICAgICAgYXJncyA9IHNlY29uZHMgPCByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzLnMgICYmIFsncycsIHNlY29uZHNdIHx8XHJcbiAgICAgICAgICAgICAgICBtaW51dGVzID09PSAxICYmIFsnbSddIHx8XHJcbiAgICAgICAgICAgICAgICBtaW51dGVzIDwgcmVsYXRpdmVUaW1lVGhyZXNob2xkcy5tICYmIFsnbW0nLCBtaW51dGVzXSB8fFxyXG4gICAgICAgICAgICAgICAgaG91cnMgPT09IDEgJiYgWydoJ10gfHxcclxuICAgICAgICAgICAgICAgIGhvdXJzIDwgcmVsYXRpdmVUaW1lVGhyZXNob2xkcy5oICYmIFsnaGgnLCBob3Vyc10gfHxcclxuICAgICAgICAgICAgICAgIGRheXMgPT09IDEgJiYgWydkJ10gfHxcclxuICAgICAgICAgICAgICAgIGRheXMgPD0gcmVsYXRpdmVUaW1lVGhyZXNob2xkcy5kZCAmJiBbJ2RkJywgZGF5c10gfHxcclxuICAgICAgICAgICAgICAgIGRheXMgPD0gcmVsYXRpdmVUaW1lVGhyZXNob2xkcy5kbSAmJiBbJ00nXSB8fFxyXG4gICAgICAgICAgICAgICAgZGF5cyA8IHJlbGF0aXZlVGltZVRocmVzaG9sZHMuZHkgJiYgWydNTScsIHJvdW5kKGRheXMgLyAzMCldIHx8XHJcbiAgICAgICAgICAgICAgICB5ZWFycyA9PT0gMSAmJiBbJ3knXSB8fCBbJ3l5JywgeWVhcnNdO1xyXG4gICAgICAgIGFyZ3NbMl0gPSB3aXRob3V0U3VmZml4O1xyXG4gICAgICAgIGFyZ3NbM10gPSBtaWxsaXNlY29uZHMgPiAwO1xyXG4gICAgICAgIGFyZ3NbNF0gPSBsYW5nO1xyXG4gICAgICAgIHJldHVybiBzdWJzdGl0dXRlVGltZUFnby5hcHBseSh7fSwgYXJncyk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBXZWVrIG9mIFllYXJcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgLy8gZmlyc3REYXlPZldlZWsgICAgICAgMCA9IHN1biwgNiA9IHNhdFxyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgdGhlIGRheSBvZiB0aGUgd2VlayB0aGF0IHN0YXJ0cyB0aGUgd2Vla1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgKHVzdWFsbHkgc3VuZGF5IG9yIG1vbmRheSlcclxuICAgIC8vIGZpcnN0RGF5T2ZXZWVrT2ZZZWFyIDAgPSBzdW4sIDYgPSBzYXRcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIHRoZSBmaXJzdCB3ZWVrIGlzIHRoZSB3ZWVrIHRoYXQgY29udGFpbnMgdGhlIGZpcnN0XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICBvZiB0aGlzIGRheSBvZiB0aGUgd2Vla1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgKGVnLiBJU08gd2Vla3MgdXNlIHRodXJzZGF5ICg0KSlcclxuICAgIGZ1bmN0aW9uIHdlZWtPZlllYXIobW9tLCBmaXJzdERheU9mV2VlaywgZmlyc3REYXlPZldlZWtPZlllYXIpIHtcclxuICAgICAgICB2YXIgZW5kID0gZmlyc3REYXlPZldlZWtPZlllYXIgLSBmaXJzdERheU9mV2VlayxcclxuICAgICAgICAgICAgZGF5c1RvRGF5T2ZXZWVrID0gZmlyc3REYXlPZldlZWtPZlllYXIgLSBtb20uZGF5KCksXHJcbiAgICAgICAgICAgIGFkanVzdGVkTW9tZW50O1xyXG5cclxuXHJcbiAgICAgICAgaWYgKGRheXNUb0RheU9mV2VlayA+IGVuZCkge1xyXG4gICAgICAgICAgICBkYXlzVG9EYXlPZldlZWsgLT0gNztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkYXlzVG9EYXlPZldlZWsgPCBlbmQgLSA3KSB7XHJcbiAgICAgICAgICAgIGRheXNUb0RheU9mV2VlayArPSA3O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWRqdXN0ZWRNb21lbnQgPSBtb21lbnQobW9tKS5hZGQoJ2QnLCBkYXlzVG9EYXlPZldlZWspO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHdlZWs6IE1hdGguY2VpbChhZGp1c3RlZE1vbWVudC5kYXlPZlllYXIoKSAvIDcpLFxyXG4gICAgICAgICAgICB5ZWFyOiBhZGp1c3RlZE1vbWVudC55ZWFyKClcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9JU09fd2Vla19kYXRlI0NhbGN1bGF0aW5nX2FfZGF0ZV9naXZlbl90aGVfeWVhci4yQ193ZWVrX251bWJlcl9hbmRfd2Vla2RheVxyXG4gICAgZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtzKHllYXIsIHdlZWssIHdlZWtkYXksIGZpcnN0RGF5T2ZXZWVrT2ZZZWFyLCBmaXJzdERheU9mV2Vlaykge1xyXG4gICAgICAgIHZhciBkID0gbWFrZVVUQ0RhdGUoeWVhciwgMCwgMSkuZ2V0VVRDRGF5KCksIGRheXNUb0FkZCwgZGF5T2ZZZWFyO1xyXG5cclxuICAgICAgICBkID0gZCA9PT0gMCA/IDcgOiBkO1xyXG4gICAgICAgIHdlZWtkYXkgPSB3ZWVrZGF5ICE9IG51bGwgPyB3ZWVrZGF5IDogZmlyc3REYXlPZldlZWs7XHJcbiAgICAgICAgZGF5c1RvQWRkID0gZmlyc3REYXlPZldlZWsgLSBkICsgKGQgPiBmaXJzdERheU9mV2Vla09mWWVhciA/IDcgOiAwKSAtIChkIDwgZmlyc3REYXlPZldlZWsgPyA3IDogMCk7XHJcbiAgICAgICAgZGF5T2ZZZWFyID0gNyAqICh3ZWVrIC0gMSkgKyAod2Vla2RheSAtIGZpcnN0RGF5T2ZXZWVrKSArIGRheXNUb0FkZCArIDE7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHllYXI6IGRheU9mWWVhciA+IDAgPyB5ZWFyIDogeWVhciAtIDEsXHJcbiAgICAgICAgICAgIGRheU9mWWVhcjogZGF5T2ZZZWFyID4gMCA/ICBkYXlPZlllYXIgOiBkYXlzSW5ZZWFyKHllYXIgLSAxKSArIGRheU9mWWVhclxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIFRvcCBMZXZlbCBGdW5jdGlvbnNcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlTW9tZW50KGNvbmZpZykge1xyXG4gICAgICAgIHZhciBpbnB1dCA9IGNvbmZpZy5faSxcclxuICAgICAgICAgICAgZm9ybWF0ID0gY29uZmlnLl9mO1xyXG5cclxuICAgICAgICBpZiAoaW5wdXQgPT09IG51bGwgfHwgKGZvcm1hdCA9PT0gdW5kZWZpbmVkICYmIGlucHV0ID09PSAnJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudC5pbnZhbGlkKHtudWxsSW5wdXQ6IHRydWV9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZy5faSA9IGlucHV0ID0gZ2V0TGFuZ0RlZmluaXRpb24oKS5wcmVwYXJzZShpbnB1dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobW9tZW50LmlzTW9tZW50KGlucHV0KSkge1xyXG4gICAgICAgICAgICBjb25maWcgPSBjbG9uZU1vbWVudChpbnB1dCk7XHJcblxyXG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgraW5wdXQuX2QpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0KSB7XHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KGZvcm1hdCkpIHtcclxuICAgICAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEFycmF5KGNvbmZpZyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBtYWtlRGF0ZUZyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG1ha2VEYXRlRnJvbUlucHV0KGNvbmZpZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IE1vbWVudChjb25maWcpO1xyXG4gICAgfVxyXG5cclxuICAgIG1vbWVudCA9IGZ1bmN0aW9uIChpbnB1dCwgZm9ybWF0LCBsYW5nLCBzdHJpY3QpIHtcclxuICAgICAgICB2YXIgYztcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZihsYW5nKSA9PT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgICAgICAgc3RyaWN0ID0gbGFuZztcclxuICAgICAgICAgICAgbGFuZyA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gb2JqZWN0IGNvbnN0cnVjdGlvbiBtdXN0IGJlIGRvbmUgdGhpcyB3YXkuXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcclxuICAgICAgICBjID0ge307XHJcbiAgICAgICAgYy5faXNBTW9tZW50T2JqZWN0ID0gdHJ1ZTtcclxuICAgICAgICBjLl9pID0gaW5wdXQ7XHJcbiAgICAgICAgYy5fZiA9IGZvcm1hdDtcclxuICAgICAgICBjLl9sID0gbGFuZztcclxuICAgICAgICBjLl9zdHJpY3QgPSBzdHJpY3Q7XHJcbiAgICAgICAgYy5faXNVVEMgPSBmYWxzZTtcclxuICAgICAgICBjLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG1ha2VNb21lbnQoYyk7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vbWVudC5zdXBwcmVzc0RlcHJlY2F0aW9uV2FybmluZ3MgPSBmYWxzZTtcclxuXHJcbiAgICBtb21lbnQuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2sgPSBkZXByZWNhdGUoXHJcbiAgICAgICAgICAgIFwibW9tZW50IGNvbnN0cnVjdGlvbiBmYWxscyBiYWNrIHRvIGpzIERhdGUuIFRoaXMgaXMgXCIgK1xyXG4gICAgICAgICAgICBcImRpc2NvdXJhZ2VkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gdXBjb21pbmcgbWFqb3IgXCIgK1xyXG4gICAgICAgICAgICBcInJlbGVhc2UuIFBsZWFzZSByZWZlciB0byBcIiArXHJcbiAgICAgICAgICAgIFwiaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MDcgZm9yIG1vcmUgaW5mby5cIixcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGNvbmZpZykge1xyXG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGNvbmZpZy5faSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBQaWNrIGEgbW9tZW50IG0gZnJvbSBtb21lbnRzIHNvIHRoYXQgbVtmbl0ob3RoZXIpIGlzIHRydWUgZm9yIGFsbFxyXG4gICAgLy8gb3RoZXIuIFRoaXMgcmVsaWVzIG9uIHRoZSBmdW5jdGlvbiBmbiB0byBiZSB0cmFuc2l0aXZlLlxyXG4gICAgLy9cclxuICAgIC8vIG1vbWVudHMgc2hvdWxkIGVpdGhlciBiZSBhbiBhcnJheSBvZiBtb21lbnQgb2JqZWN0cyBvciBhbiBhcnJheSwgd2hvc2VcclxuICAgIC8vIGZpcnN0IGVsZW1lbnQgaXMgYW4gYXJyYXkgb2YgbW9tZW50IG9iamVjdHMuXHJcbiAgICBmdW5jdGlvbiBwaWNrQnkoZm4sIG1vbWVudHMpIHtcclxuICAgICAgICB2YXIgcmVzLCBpO1xyXG4gICAgICAgIGlmIChtb21lbnRzLmxlbmd0aCA9PT0gMSAmJiBpc0FycmF5KG1vbWVudHNbMF0pKSB7XHJcbiAgICAgICAgICAgIG1vbWVudHMgPSBtb21lbnRzWzBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIW1vbWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVzID0gbW9tZW50c1swXTtcclxuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbW9tZW50cy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICBpZiAobW9tZW50c1tpXVtmbl0ocmVzKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzID0gbW9tZW50c1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfVxyXG5cclxuICAgIG1vbWVudC5taW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XHJcblxyXG4gICAgICAgIHJldHVybiBwaWNrQnkoJ2lzQmVmb3JlJywgYXJncyk7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vbWVudC5tYXggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XHJcblxyXG4gICAgICAgIHJldHVybiBwaWNrQnkoJ2lzQWZ0ZXInLCBhcmdzKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gY3JlYXRpbmcgd2l0aCB1dGNcclxuICAgIG1vbWVudC51dGMgPSBmdW5jdGlvbiAoaW5wdXQsIGZvcm1hdCwgbGFuZywgc3RyaWN0KSB7XHJcbiAgICAgICAgdmFyIGM7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YobGFuZykgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgICAgIHN0cmljdCA9IGxhbmc7XHJcbiAgICAgICAgICAgIGxhbmcgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIG9iamVjdCBjb25zdHJ1Y3Rpb24gbXVzdCBiZSBkb25lIHRoaXMgd2F5LlxyXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNDIzXHJcbiAgICAgICAgYyA9IHt9O1xyXG4gICAgICAgIGMuX2lzQU1vbWVudE9iamVjdCA9IHRydWU7XHJcbiAgICAgICAgYy5fdXNlVVRDID0gdHJ1ZTtcclxuICAgICAgICBjLl9pc1VUQyA9IHRydWU7XHJcbiAgICAgICAgYy5fbCA9IGxhbmc7XHJcbiAgICAgICAgYy5faSA9IGlucHV0O1xyXG4gICAgICAgIGMuX2YgPSBmb3JtYXQ7XHJcbiAgICAgICAgYy5fc3RyaWN0ID0gc3RyaWN0O1xyXG4gICAgICAgIGMuX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xyXG5cclxuICAgICAgICByZXR1cm4gbWFrZU1vbWVudChjKS51dGMoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gY3JlYXRpbmcgd2l0aCB1bml4IHRpbWVzdGFtcCAoaW4gc2Vjb25kcylcclxuICAgIG1vbWVudC51bml4ID0gZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCAqIDEwMDApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBkdXJhdGlvblxyXG4gICAgbW9tZW50LmR1cmF0aW9uID0gZnVuY3Rpb24gKGlucHV0LCBrZXkpIHtcclxuICAgICAgICB2YXIgZHVyYXRpb24gPSBpbnB1dCxcclxuICAgICAgICAgICAgLy8gbWF0Y2hpbmcgYWdhaW5zdCByZWdleHAgaXMgZXhwZW5zaXZlLCBkbyBpdCBvbiBkZW1hbmRcclxuICAgICAgICAgICAgbWF0Y2ggPSBudWxsLFxyXG4gICAgICAgICAgICBzaWduLFxyXG4gICAgICAgICAgICByZXQsXHJcbiAgICAgICAgICAgIHBhcnNlSXNvO1xyXG5cclxuICAgICAgICBpZiAobW9tZW50LmlzRHVyYXRpb24oaW5wdXQpKSB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge1xyXG4gICAgICAgICAgICAgICAgbXM6IGlucHV0Ll9taWxsaXNlY29uZHMsXHJcbiAgICAgICAgICAgICAgICBkOiBpbnB1dC5fZGF5cyxcclxuICAgICAgICAgICAgICAgIE06IGlucHV0Ll9tb250aHNcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgZHVyYXRpb24gPSB7fTtcclxuICAgICAgICAgICAgaWYgKGtleSkge1xyXG4gICAgICAgICAgICAgICAgZHVyYXRpb25ba2V5XSA9IGlucHV0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZHVyYXRpb24ubWlsbGlzZWNvbmRzID0gaW5wdXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gYXNwTmV0VGltZVNwYW5Kc29uUmVnZXguZXhlYyhpbnB1dCkpKSB7XHJcbiAgICAgICAgICAgIHNpZ24gPSAobWF0Y2hbMV0gPT09IFwiLVwiKSA/IC0xIDogMTtcclxuICAgICAgICAgICAgZHVyYXRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICB5OiAwLFxyXG4gICAgICAgICAgICAgICAgZDogdG9JbnQobWF0Y2hbREFURV0pICogc2lnbixcclxuICAgICAgICAgICAgICAgIGg6IHRvSW50KG1hdGNoW0hPVVJdKSAqIHNpZ24sXHJcbiAgICAgICAgICAgICAgICBtOiB0b0ludChtYXRjaFtNSU5VVEVdKSAqIHNpZ24sXHJcbiAgICAgICAgICAgICAgICBzOiB0b0ludChtYXRjaFtTRUNPTkRdKSAqIHNpZ24sXHJcbiAgICAgICAgICAgICAgICBtczogdG9JbnQobWF0Y2hbTUlMTElTRUNPTkRdKSAqIHNpZ25cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gaXNvRHVyYXRpb25SZWdleC5leGVjKGlucHV0KSkpIHtcclxuICAgICAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gXCItXCIpID8gLTEgOiAxO1xyXG4gICAgICAgICAgICBwYXJzZUlzbyA9IGZ1bmN0aW9uIChpbnApIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlJ2Qgbm9ybWFsbHkgdXNlIH5+aW5wIGZvciB0aGlzLCBidXQgdW5mb3J0dW5hdGVseSBpdCBhbHNvXHJcbiAgICAgICAgICAgICAgICAvLyBjb252ZXJ0cyBmbG9hdHMgdG8gaW50cy5cclxuICAgICAgICAgICAgICAgIC8vIGlucCBtYXkgYmUgdW5kZWZpbmVkLCBzbyBjYXJlZnVsIGNhbGxpbmcgcmVwbGFjZSBvbiBpdC5cclxuICAgICAgICAgICAgICAgIHZhciByZXMgPSBpbnAgJiYgcGFyc2VGbG9hdChpbnAucmVwbGFjZSgnLCcsICcuJykpO1xyXG4gICAgICAgICAgICAgICAgLy8gYXBwbHkgc2lnbiB3aGlsZSB3ZSdyZSBhdCBpdFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChpc05hTihyZXMpID8gMCA6IHJlcykgKiBzaWduO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgIHk6IHBhcnNlSXNvKG1hdGNoWzJdKSxcclxuICAgICAgICAgICAgICAgIE06IHBhcnNlSXNvKG1hdGNoWzNdKSxcclxuICAgICAgICAgICAgICAgIGQ6IHBhcnNlSXNvKG1hdGNoWzRdKSxcclxuICAgICAgICAgICAgICAgIGg6IHBhcnNlSXNvKG1hdGNoWzVdKSxcclxuICAgICAgICAgICAgICAgIG06IHBhcnNlSXNvKG1hdGNoWzZdKSxcclxuICAgICAgICAgICAgICAgIHM6IHBhcnNlSXNvKG1hdGNoWzddKSxcclxuICAgICAgICAgICAgICAgIHc6IHBhcnNlSXNvKG1hdGNoWzhdKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0ID0gbmV3IER1cmF0aW9uKGR1cmF0aW9uKTtcclxuXHJcbiAgICAgICAgaWYgKG1vbWVudC5pc0R1cmF0aW9uKGlucHV0KSAmJiBpbnB1dC5oYXNPd25Qcm9wZXJ0eSgnX2xhbmcnKSkge1xyXG4gICAgICAgICAgICByZXQuX2xhbmcgPSBpbnB1dC5fbGFuZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIHZlcnNpb24gbnVtYmVyXHJcbiAgICBtb21lbnQudmVyc2lvbiA9IFZFUlNJT047XHJcblxyXG4gICAgLy8gZGVmYXVsdCBmb3JtYXRcclxuICAgIG1vbWVudC5kZWZhdWx0Rm9ybWF0ID0gaXNvRm9ybWF0O1xyXG5cclxuICAgIC8vIGNvbnN0YW50IHRoYXQgcmVmZXJzIHRvIHRoZSBJU08gc3RhbmRhcmRcclxuICAgIG1vbWVudC5JU09fODYwMSA9IGZ1bmN0aW9uICgpIHt9O1xyXG5cclxuICAgIC8vIFBsdWdpbnMgdGhhdCBhZGQgcHJvcGVydGllcyBzaG91bGQgYWxzbyBhZGQgdGhlIGtleSBoZXJlIChudWxsIHZhbHVlKSxcclxuICAgIC8vIHNvIHdlIGNhbiBwcm9wZXJseSBjbG9uZSBvdXJzZWx2ZXMuXHJcbiAgICBtb21lbnQubW9tZW50UHJvcGVydGllcyA9IG1vbWVudFByb3BlcnRpZXM7XHJcblxyXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB3aGVuZXZlciBhIG1vbWVudCBpcyBtdXRhdGVkLlxyXG4gICAgLy8gSXQgaXMgaW50ZW5kZWQgdG8ga2VlcCB0aGUgb2Zmc2V0IGluIHN5bmMgd2l0aCB0aGUgdGltZXpvbmUuXHJcbiAgICBtb21lbnQudXBkYXRlT2Zmc2V0ID0gZnVuY3Rpb24gKCkge307XHJcblxyXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIHNldCBhIHRocmVzaG9sZCBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXHJcbiAgICBtb21lbnQucmVsYXRpdmVUaW1lVGhyZXNob2xkID0gZnVuY3Rpb24odGhyZXNob2xkLCBsaW1pdCkge1xyXG4gICAgICBpZiAocmVsYXRpdmVUaW1lVGhyZXNob2xkc1t0aHJlc2hvbGRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgcmVsYXRpdmVUaW1lVGhyZXNob2xkc1t0aHJlc2hvbGRdID0gbGltaXQ7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgbG9hZCBsYW5ndWFnZXMgYW5kIHRoZW4gc2V0IHRoZSBnbG9iYWwgbGFuZ3VhZ2UuICBJZlxyXG4gICAgLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBnbG9iYWxcclxuICAgIC8vIGxhbmd1YWdlIGtleS5cclxuICAgIG1vbWVudC5sYW5nID0gZnVuY3Rpb24gKGtleSwgdmFsdWVzKSB7XHJcbiAgICAgICAgdmFyIHI7XHJcbiAgICAgICAgaWYgKCFrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudC5mbi5fbGFuZy5fYWJicjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbHVlcykge1xyXG4gICAgICAgICAgICBsb2FkTGFuZyhub3JtYWxpemVMYW5ndWFnZShrZXkpLCB2YWx1ZXMpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWVzID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHVubG9hZExhbmcoa2V5KTtcclxuICAgICAgICAgICAga2V5ID0gJ2VuJztcclxuICAgICAgICB9IGVsc2UgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xyXG4gICAgICAgICAgICBnZXRMYW5nRGVmaW5pdGlvbihrZXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByID0gbW9tZW50LmR1cmF0aW9uLmZuLl9sYW5nID0gbW9tZW50LmZuLl9sYW5nID0gZ2V0TGFuZ0RlZmluaXRpb24oa2V5KTtcclxuICAgICAgICByZXR1cm4gci5fYWJicjtcclxuICAgIH07XHJcblxyXG4gICAgLy8gcmV0dXJucyBsYW5ndWFnZSBkYXRhXHJcbiAgICBtb21lbnQubGFuZ0RhdGEgPSBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgaWYgKGtleSAmJiBrZXkuX2xhbmcgJiYga2V5Ll9sYW5nLl9hYmJyKSB7XHJcbiAgICAgICAgICAgIGtleSA9IGtleS5fbGFuZy5fYWJicjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGdldExhbmdEZWZpbml0aW9uKGtleSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGNvbXBhcmUgbW9tZW50IG9iamVjdFxyXG4gICAgbW9tZW50LmlzTW9tZW50ID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBNb21lbnQgfHxcclxuICAgICAgICAgICAgKG9iaiAhPSBudWxsICYmICBvYmouaGFzT3duUHJvcGVydHkoJ19pc0FNb21lbnRPYmplY3QnKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGZvciB0eXBlY2hlY2tpbmcgRHVyYXRpb24gb2JqZWN0c1xyXG4gICAgbW9tZW50LmlzRHVyYXRpb24gPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIER1cmF0aW9uO1xyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKGkgPSBsaXN0cy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xyXG4gICAgICAgIG1ha2VMaXN0KGxpc3RzW2ldKTtcclxuICAgIH1cclxuXHJcbiAgICBtb21lbnQubm9ybWFsaXplVW5pdHMgPSBmdW5jdGlvbiAodW5pdHMpIHtcclxuICAgICAgICByZXR1cm4gbm9ybWFsaXplVW5pdHModW5pdHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb21lbnQuaW52YWxpZCA9IGZ1bmN0aW9uIChmbGFncykge1xyXG4gICAgICAgIHZhciBtID0gbW9tZW50LnV0YyhOYU4pO1xyXG4gICAgICAgIGlmIChmbGFncyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGV4dGVuZChtLl9wZiwgZmxhZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbS5fcGYudXNlckludmFsaWRhdGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb21lbnQucGFyc2Vab25lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBtb21lbnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKS5wYXJzZVpvbmUoKTtcclxuICAgIH07XHJcblxyXG4gICAgbW9tZW50LnBhcnNlVHdvRGlnaXRZZWFyID0gZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgcmV0dXJuIHRvSW50KGlucHV0KSArICh0b0ludChpbnB1dCkgPiA2OCA/IDE5MDAgOiAyMDAwKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIE1vbWVudCBQcm90b3R5cGVcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgZXh0ZW5kKG1vbWVudC5mbiA9IE1vbWVudC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAgICAgY2xvbmUgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQodGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICt0aGlzLl9kICsgKCh0aGlzLl9vZmZzZXQgfHwgMCkgKiA2MDAwMCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdW5peCA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoK3RoaXMgLyAxMDAwKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5sYW5nKCdlbicpLmZvcm1hdChcImRkZCBNTU0gREQgWVlZWSBISDptbTpzcyBbR01UXVpaXCIpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRvRGF0ZSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29mZnNldCA/IG5ldyBEYXRlKCt0aGlzKSA6IHRoaXMuX2Q7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9JU09TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBtID0gbW9tZW50KHRoaXMpLnV0YygpO1xyXG4gICAgICAgICAgICBpZiAoMCA8IG0ueWVhcigpICYmIG0ueWVhcigpIDw9IDk5OTkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVktTU0tRERbVF1ISDptbTpzcy5TU1NbWl0nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9BcnJheSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG0gPSB0aGlzO1xyXG4gICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgbS55ZWFyKCksXHJcbiAgICAgICAgICAgICAgICBtLm1vbnRoKCksXHJcbiAgICAgICAgICAgICAgICBtLmRhdGUoKSxcclxuICAgICAgICAgICAgICAgIG0uaG91cnMoKSxcclxuICAgICAgICAgICAgICAgIG0ubWludXRlcygpLFxyXG4gICAgICAgICAgICAgICAgbS5zZWNvbmRzKCksXHJcbiAgICAgICAgICAgICAgICBtLm1pbGxpc2Vjb25kcygpXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNWYWxpZCA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzVmFsaWQodGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNEU1RTaGlmdGVkIDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX2EpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSAmJiBjb21wYXJlQXJyYXlzKHRoaXMuX2EsICh0aGlzLl9pc1VUQyA/IG1vbWVudC51dGModGhpcy5fYSkgOiBtb21lbnQodGhpcy5fYSkpLnRvQXJyYXkoKSkgPiAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcGFyc2luZ0ZsYWdzIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXh0ZW5kKHt9LCB0aGlzLl9wZik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaW52YWxpZEF0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wZi5vdmVyZmxvdztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB1dGMgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnpvbmUoMCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbG9jYWwgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuem9uZSgwKTtcclxuICAgICAgICAgICAgdGhpcy5faXNVVEMgPSBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZm9ybWF0IDogZnVuY3Rpb24gKGlucHV0U3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSBmb3JtYXRNb21lbnQodGhpcywgaW5wdXRTdHJpbmcgfHwgbW9tZW50LmRlZmF1bHRGb3JtYXQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkucG9zdGZvcm1hdChvdXRwdXQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFkZCA6IGZ1bmN0aW9uIChpbnB1dCwgdmFsKSB7XHJcbiAgICAgICAgICAgIHZhciBkdXI7XHJcbiAgICAgICAgICAgIC8vIHN3aXRjaCBhcmdzIHRvIHN1cHBvcnQgYWRkKCdzJywgMSkgYW5kIGFkZCgxLCAncycpXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICBkdXIgPSBtb21lbnQuZHVyYXRpb24oaXNOYU4oK3ZhbCkgPyAraW5wdXQgOiArdmFsLCBpc05hTigrdmFsKSA/IHZhbCA6IGlucHV0KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICBkdXIgPSBtb21lbnQuZHVyYXRpb24oK3ZhbCwgaW5wdXQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZHVyID0gbW9tZW50LmR1cmF0aW9uKGlucHV0LCB2YWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGFkZE9yU3VidHJhY3REdXJhdGlvbkZyb21Nb21lbnQodGhpcywgZHVyLCAxKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc3VidHJhY3QgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xyXG4gICAgICAgICAgICB2YXIgZHVyO1xyXG4gICAgICAgICAgICAvLyBzd2l0Y2ggYXJncyB0byBzdXBwb3J0IHN1YnRyYWN0KCdzJywgMSkgYW5kIHN1YnRyYWN0KDEsICdzJylcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpc05hTigrdmFsKSA/ICtpbnB1dCA6ICt2YWwsIGlzTmFOKCt2YWwpID8gdmFsIDogaW5wdXQpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbigrdmFsLCBpbnB1dCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkdXIgPSBtb21lbnQuZHVyYXRpb24oaW5wdXQsIHZhbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudCh0aGlzLCBkdXIsIC0xKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZGlmZiA6IGZ1bmN0aW9uIChpbnB1dCwgdW5pdHMsIGFzRmxvYXQpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSBtYWtlQXMoaW5wdXQsIHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgem9uZURpZmYgPSAodGhpcy56b25lKCkgLSB0aGF0LnpvbmUoKSkgKiA2ZTQsXHJcbiAgICAgICAgICAgICAgICBkaWZmLCBvdXRwdXQ7XHJcblxyXG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ3llYXInIHx8IHVuaXRzID09PSAnbW9udGgnKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBhdmVyYWdlIG51bWJlciBvZiBkYXlzIGluIHRoZSBtb250aHMgaW4gdGhlIGdpdmVuIGRhdGVzXHJcbiAgICAgICAgICAgICAgICBkaWZmID0gKHRoaXMuZGF5c0luTW9udGgoKSArIHRoYXQuZGF5c0luTW9udGgoKSkgKiA0MzJlNTsgLy8gMjQgKiA2MCAqIDYwICogMTAwMCAvIDJcclxuICAgICAgICAgICAgICAgIC8vIGRpZmZlcmVuY2UgaW4gbW9udGhzXHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSAoKHRoaXMueWVhcigpIC0gdGhhdC55ZWFyKCkpICogMTIpICsgKHRoaXMubW9udGgoKSAtIHRoYXQubW9udGgoKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBhZGp1c3QgYnkgdGFraW5nIGRpZmZlcmVuY2UgaW4gZGF5cywgYXZlcmFnZSBudW1iZXIgb2YgZGF5c1xyXG4gICAgICAgICAgICAgICAgLy8gYW5kIGRzdCBpbiB0aGUgZ2l2ZW4gbW9udGhzLlxyXG4gICAgICAgICAgICAgICAgb3V0cHV0ICs9ICgodGhpcyAtIG1vbWVudCh0aGlzKS5zdGFydE9mKCdtb250aCcpKSAtXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGF0IC0gbW9tZW50KHRoYXQpLnN0YXJ0T2YoJ21vbnRoJykpKSAvIGRpZmY7XHJcbiAgICAgICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aXRoIHpvbmVzLCB0byBuZWdhdGUgYWxsIGRzdFxyXG4gICAgICAgICAgICAgICAgb3V0cHV0IC09ICgodGhpcy56b25lKCkgLSBtb21lbnQodGhpcykuc3RhcnRPZignbW9udGgnKS56b25lKCkpIC1cclxuICAgICAgICAgICAgICAgICAgICAgICAgKHRoYXQuem9uZSgpIC0gbW9tZW50KHRoYXQpLnN0YXJ0T2YoJ21vbnRoJykuem9uZSgpKSkgKiA2ZTQgLyBkaWZmO1xyXG4gICAgICAgICAgICAgICAgaWYgKHVuaXRzID09PSAneWVhcicpIHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgLyAxMjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRpZmYgPSAodGhpcyAtIHRoYXQpO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gdW5pdHMgPT09ICdzZWNvbmQnID8gZGlmZiAvIDFlMyA6IC8vIDEwMDBcclxuICAgICAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ21pbnV0ZScgPyBkaWZmIC8gNmU0IDogLy8gMTAwMCAqIDYwXHJcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICdob3VyJyA/IGRpZmYgLyAzNmU1IDogLy8gMTAwMCAqIDYwICogNjBcclxuICAgICAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ2RheScgPyAoZGlmZiAtIHpvbmVEaWZmKSAvIDg2NGU1IDogLy8gMTAwMCAqIDYwICogNjAgKiAyNCwgbmVnYXRlIGRzdFxyXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnd2VlaycgPyAoZGlmZiAtIHpvbmVEaWZmKSAvIDYwNDhlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQgKiA3LCBuZWdhdGUgZHN0XHJcbiAgICAgICAgICAgICAgICAgICAgZGlmZjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYXNGbG9hdCA/IG91dHB1dCA6IGFic1JvdW5kKG91dHB1dCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZnJvbSA6IGZ1bmN0aW9uICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuZHVyYXRpb24odGhpcy5kaWZmKHRpbWUpKS5sYW5nKHRoaXMubGFuZygpLl9hYmJyKS5odW1hbml6ZSghd2l0aG91dFN1ZmZpeCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZnJvbU5vdyA6IGZ1bmN0aW9uICh3aXRob3V0U3VmZml4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZyb20obW9tZW50KCksIHdpdGhvdXRTdWZmaXgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGNhbGVuZGFyIDogZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCB0byBjb21wYXJlIHRoZSBzdGFydCBvZiB0b2RheSwgdnMgdGhpcy5cclxuICAgICAgICAgICAgLy8gR2V0dGluZyBzdGFydC1vZi10b2RheSBkZXBlbmRzIG9uIHdoZXRoZXIgd2UncmUgem9uZSdkIG9yIG5vdC5cclxuICAgICAgICAgICAgdmFyIG5vdyA9IHRpbWUgfHwgbW9tZW50KCksXHJcbiAgICAgICAgICAgICAgICBzb2QgPSBtYWtlQXMobm93LCB0aGlzKS5zdGFydE9mKCdkYXknKSxcclxuICAgICAgICAgICAgICAgIGRpZmYgPSB0aGlzLmRpZmYoc29kLCAnZGF5cycsIHRydWUpLFxyXG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZGlmZiA8IC02ID8gJ3NhbWVFbHNlJyA6XHJcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IC0xID8gJ2xhc3RXZWVrJyA6XHJcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IDAgPyAnbGFzdERheScgOlxyXG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAxID8gJ3NhbWVEYXknIDpcclxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgMiA/ICduZXh0RGF5JyA6XHJcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IDcgPyAnbmV4dFdlZWsnIDogJ3NhbWVFbHNlJztcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0KHRoaXMubGFuZygpLmNhbGVuZGFyKGZvcm1hdCwgdGhpcykpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzTGVhcFllYXIgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0xlYXBZZWFyKHRoaXMueWVhcigpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc0RTVCA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICh0aGlzLnpvbmUoKSA8IHRoaXMuY2xvbmUoKS5tb250aCgwKS56b25lKCkgfHxcclxuICAgICAgICAgICAgICAgIHRoaXMuem9uZSgpIDwgdGhpcy5jbG9uZSgpLm1vbnRoKDUpLnpvbmUoKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZGF5IDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIHZhciBkYXkgPSB0aGlzLl9pc1VUQyA/IHRoaXMuX2QuZ2V0VVRDRGF5KCkgOiB0aGlzLl9kLmdldERheSgpO1xyXG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaW5wdXQgPSBwYXJzZVdlZWtkYXkoaW5wdXQsIHRoaXMubGFuZygpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZCh7IGQgOiBpbnB1dCAtIGRheSB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkYXk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBtb250aCA6IG1ha2VBY2Nlc3NvcignTW9udGgnLCB0cnVlKSxcclxuXHJcbiAgICAgICAgc3RhcnRPZjogZnVuY3Rpb24gKHVuaXRzKSB7XHJcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xyXG4gICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIHN3aXRjaCBpbnRlbnRpb25hbGx5IG9taXRzIGJyZWFrIGtleXdvcmRzXHJcbiAgICAgICAgICAgIC8vIHRvIHV0aWxpemUgZmFsbGluZyB0aHJvdWdoIHRoZSBjYXNlcy5cclxuICAgICAgICAgICAgc3dpdGNoICh1bml0cykge1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFyJzpcclxuICAgICAgICAgICAgICAgIHRoaXMubW9udGgoMCk7XHJcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgICAgIGNhc2UgJ3F1YXJ0ZXInOlxyXG4gICAgICAgICAgICBjYXNlICdtb250aCc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGUoMSk7XHJcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgICAgIGNhc2UgJ3dlZWsnOlxyXG4gICAgICAgICAgICBjYXNlICdpc29XZWVrJzpcclxuICAgICAgICAgICAgY2FzZSAnZGF5JzpcclxuICAgICAgICAgICAgICAgIHRoaXMuaG91cnMoMCk7XHJcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgICAgIGNhc2UgJ2hvdXInOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW51dGVzKDApO1xyXG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xyXG4gICAgICAgICAgICBjYXNlICdtaW51dGUnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWNvbmRzKDApO1xyXG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xyXG4gICAgICAgICAgICBjYXNlICdzZWNvbmQnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHMoMCk7XHJcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHdlZWtzIGFyZSBhIHNwZWNpYWwgY2FzZVxyXG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICd3ZWVrJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53ZWVrZGF5KDApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHVuaXRzID09PSAnaXNvV2VlaycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNvV2Vla2RheSgxKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gcXVhcnRlcnMgYXJlIGFsc28gc3BlY2lhbFxyXG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICdxdWFydGVyJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb250aChNYXRoLmZsb29yKHRoaXMubW9udGgoKSAvIDMpICogMyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVuZE9mOiBmdW5jdGlvbiAodW5pdHMpIHtcclxuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0T2YodW5pdHMpLmFkZCgodW5pdHMgPT09ICdpc29XZWVrJyA/ICd3ZWVrJyA6IHVuaXRzKSwgMSkuc3VidHJhY3QoJ21zJywgMSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNBZnRlcjogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xyXG4gICAgICAgICAgICB1bml0cyA9IHR5cGVvZiB1bml0cyAhPT0gJ3VuZGVmaW5lZCcgPyB1bml0cyA6ICdtaWxsaXNlY29uZCc7XHJcbiAgICAgICAgICAgIHJldHVybiArdGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpID4gK21vbWVudChpbnB1dCkuc3RhcnRPZih1bml0cyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNCZWZvcmU6IGZ1bmN0aW9uIChpbnB1dCwgdW5pdHMpIHtcclxuICAgICAgICAgICAgdW5pdHMgPSB0eXBlb2YgdW5pdHMgIT09ICd1bmRlZmluZWQnID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnO1xyXG4gICAgICAgICAgICByZXR1cm4gK3RoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKSA8ICttb21lbnQoaW5wdXQpLnN0YXJ0T2YodW5pdHMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzU2FtZTogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xyXG4gICAgICAgICAgICB1bml0cyA9IHVuaXRzIHx8ICdtcyc7XHJcbiAgICAgICAgICAgIHJldHVybiArdGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpID09PSArbWFrZUFzKGlucHV0LCB0aGlzKS5zdGFydE9mKHVuaXRzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBtaW46IGRlcHJlY2F0ZShcclxuICAgICAgICAgICAgICAgICBcIm1vbWVudCgpLm1pbiBpcyBkZXByZWNhdGVkLCB1c2UgbW9tZW50Lm1pbiBpbnN0ZWFkLiBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTU0OFwiLFxyXG4gICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChvdGhlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICBvdGhlciA9IG1vbWVudC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3RoZXIgPCB0aGlzID8gdGhpcyA6IG90aGVyO1xyXG4gICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgbWF4OiBkZXByZWNhdGUoXHJcbiAgICAgICAgICAgICAgICBcIm1vbWVudCgpLm1heCBpcyBkZXByZWNhdGVkLCB1c2UgbW9tZW50Lm1heCBpbnN0ZWFkLiBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTU0OFwiLFxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKG90aGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3RoZXIgPSBtb21lbnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3RoZXIgPiB0aGlzID8gdGhpcyA6IG90aGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICksXHJcblxyXG4gICAgICAgIC8vIGtlZXBUaW1lID0gdHJ1ZSBtZWFucyBvbmx5IGNoYW5nZSB0aGUgdGltZXpvbmUsIHdpdGhvdXQgYWZmZWN0aW5nXHJcbiAgICAgICAgLy8gdGhlIGxvY2FsIGhvdXIuIFNvIDU6MzE6MjYgKzAzMDAgLS1bem9uZSgyLCB0cnVlKV0tLT4gNTozMToyNiArMDIwMFxyXG4gICAgICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRoYXQgNTozMToyNiBkb2Vzbid0IGV4aXN0IGludCB6b25lICswMjAwLCBzbyB3ZVxyXG4gICAgICAgIC8vIGFkanVzdCB0aGUgdGltZSBhcyBuZWVkZWQsIHRvIGJlIHZhbGlkLlxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gS2VlcGluZyB0aGUgdGltZSBhY3R1YWxseSBhZGRzL3N1YnRyYWN0cyAob25lIGhvdXIpXHJcbiAgICAgICAgLy8gZnJvbSB0aGUgYWN0dWFsIHJlcHJlc2VudGVkIHRpbWUuIFRoYXQgaXMgd2h5IHdlIGNhbGwgdXBkYXRlT2Zmc2V0XHJcbiAgICAgICAgLy8gYSBzZWNvbmQgdGltZS4gSW4gY2FzZSBpdCB3YW50cyB1cyB0byBjaGFuZ2UgdGhlIG9mZnNldCBhZ2FpblxyXG4gICAgICAgIC8vIF9jaGFuZ2VJblByb2dyZXNzID09IHRydWUgY2FzZSwgdGhlbiB3ZSBoYXZlIHRvIGFkanVzdCwgYmVjYXVzZVxyXG4gICAgICAgIC8vIHRoZXJlIGlzIG5vIHN1Y2ggdGltZSBpbiB0aGUgZ2l2ZW4gdGltZXpvbmUuXHJcbiAgICAgICAgem9uZSA6IGZ1bmN0aW9uIChpbnB1dCwga2VlcFRpbWUpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuX29mZnNldCB8fCAwO1xyXG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gdGltZXpvbmVNaW51dGVzRnJvbVN0cmluZyhpbnB1dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoaW5wdXQpIDwgMTYpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IGlucHV0ICogNjA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9vZmZzZXQgPSBpbnB1dDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2lzVVRDID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgIT09IGlucHV0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFrZWVwVGltZSB8fCB0aGlzLl9jaGFuZ2VJblByb2dyZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZE9yU3VidHJhY3REdXJhdGlvbkZyb21Nb21lbnQodGhpcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb21lbnQuZHVyYXRpb24ob2Zmc2V0IC0gaW5wdXQsICdtJyksIDEsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLl9jaGFuZ2VJblByb2dyZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb21lbnQudXBkYXRlT2Zmc2V0KHRoaXMsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jaGFuZ2VJblByb2dyZXNzID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBvZmZzZXQgOiB0aGlzLl9kLmdldFRpbWV6b25lT2Zmc2V0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgem9uZUFiYnIgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/IFwiVVRDXCIgOiBcIlwiO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHpvbmVOYW1lIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBcIkNvb3JkaW5hdGVkIFVuaXZlcnNhbCBUaW1lXCIgOiBcIlwiO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhcnNlWm9uZSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3R6bSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy56b25lKHRoaXMuX3R6bSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMuX2kgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnpvbmUodGhpcy5faSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGFzQWxpZ25lZEhvdXJPZmZzZXQgOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgaWYgKCFpbnB1dCkge1xyXG4gICAgICAgICAgICAgICAgaW5wdXQgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaW5wdXQgPSBtb21lbnQoaW5wdXQpLnpvbmUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuICh0aGlzLnpvbmUoKSAtIGlucHV0KSAlIDYwID09PSAwO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGRheXNJbk1vbnRoIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZGF5c0luTW9udGgodGhpcy55ZWFyKCksIHRoaXMubW9udGgoKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZGF5T2ZZZWFyIDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIHZhciBkYXlPZlllYXIgPSByb3VuZCgobW9tZW50KHRoaXMpLnN0YXJ0T2YoJ2RheScpIC0gbW9tZW50KHRoaXMpLnN0YXJ0T2YoJ3llYXInKSkgLyA4NjRlNSkgKyAxO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IGRheU9mWWVhciA6IHRoaXMuYWRkKFwiZFwiLCAoaW5wdXQgLSBkYXlPZlllYXIpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBxdWFydGVyIDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gTWF0aC5jZWlsKCh0aGlzLm1vbnRoKCkgKyAxKSAvIDMpIDogdGhpcy5tb250aCgoaW5wdXQgLSAxKSAqIDMgKyB0aGlzLm1vbnRoKCkgJSAzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB3ZWVrWWVhciA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICB2YXIgeWVhciA9IHdlZWtPZlllYXIodGhpcywgdGhpcy5sYW5nKCkuX3dlZWsuZG93LCB0aGlzLmxhbmcoKS5fd2Vlay5kb3kpLnllYXI7XHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8geWVhciA6IHRoaXMuYWRkKFwieVwiLCAoaW5wdXQgLSB5ZWFyKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNvV2Vla1llYXIgOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgdmFyIHllYXIgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLnllYXI7XHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8geWVhciA6IHRoaXMuYWRkKFwieVwiLCAoaW5wdXQgLSB5ZWFyKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgd2VlayA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICB2YXIgd2VlayA9IHRoaXMubGFuZygpLndlZWsodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2VlayA6IHRoaXMuYWRkKFwiZFwiLCAoaW5wdXQgLSB3ZWVrKSAqIDcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzb1dlZWsgOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgdmFyIHdlZWsgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLndlZWs7XHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2VlayA6IHRoaXMuYWRkKFwiZFwiLCAoaW5wdXQgLSB3ZWVrKSAqIDcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHdlZWtkYXkgOiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICAgICAgdmFyIHdlZWtkYXkgPSAodGhpcy5kYXkoKSArIDcgLSB0aGlzLmxhbmcoKS5fd2Vlay5kb3cpICUgNztcclxuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrZGF5IDogdGhpcy5hZGQoXCJkXCIsIGlucHV0IC0gd2Vla2RheSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNvV2Vla2RheSA6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgICAgICAvLyBiZWhhdmVzIHRoZSBzYW1lIGFzIG1vbWVudCNkYXkgZXhjZXB0XHJcbiAgICAgICAgICAgIC8vIGFzIGEgZ2V0dGVyLCByZXR1cm5zIDcgaW5zdGVhZCBvZiAwICgxLTcgcmFuZ2UgaW5zdGVhZCBvZiAwLTYpXHJcbiAgICAgICAgICAgIC8vIGFzIGEgc2V0dGVyLCBzdW5kYXkgc2hvdWxkIGJlbG9uZyB0byB0aGUgcHJldmlvdXMgd2Vlay5cclxuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB0aGlzLmRheSgpIHx8IDcgOiB0aGlzLmRheSh0aGlzLmRheSgpICUgNyA/IGlucHV0IDogaW5wdXQgLSA3KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc29XZWVrc0luWWVhciA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHdlZWtzSW5ZZWFyKHRoaXMueWVhcigpLCAxLCA0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB3ZWVrc0luWWVhciA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHdlZWtJbmZvID0gdGhpcy5fbGFuZy5fd2VlaztcclxuICAgICAgICAgICAgcmV0dXJuIHdlZWtzSW5ZZWFyKHRoaXMueWVhcigpLCB3ZWVrSW5mby5kb3csIHdlZWtJbmZvLmRveSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0IDogZnVuY3Rpb24gKHVuaXRzKSB7XHJcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1t1bml0c10oKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQgOiBmdW5jdGlvbiAodW5pdHMsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXNbdW5pdHNdID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW3VuaXRzXSh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8gSWYgcGFzc2VkIGEgbGFuZ3VhZ2Uga2V5LCBpdCB3aWxsIHNldCB0aGUgbGFuZ3VhZ2UgZm9yIHRoaXNcclxuICAgICAgICAvLyBpbnN0YW5jZS4gIE90aGVyd2lzZSwgaXQgd2lsbCByZXR1cm4gdGhlIGxhbmd1YWdlIGNvbmZpZ3VyYXRpb25cclxuICAgICAgICAvLyB2YXJpYWJsZXMgZm9yIHRoaXMgaW5zdGFuY2UuXHJcbiAgICAgICAgbGFuZyA6IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbGFuZztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xhbmcgPSBnZXRMYW5nRGVmaW5pdGlvbihrZXkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiByYXdNb250aFNldHRlcihtb20sIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGRheU9mTW9udGg7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IE1vdmUgdGhpcyBvdXQgb2YgaGVyZSFcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IG1vbS5sYW5nKCkubW9udGhzUGFyc2UodmFsdWUpO1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBBbm90aGVyIHNpbGVudCBmYWlsdXJlP1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vbTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGF5T2ZNb250aCA9IE1hdGgubWluKG1vbS5kYXRlKCksXHJcbiAgICAgICAgICAgICAgICBkYXlzSW5Nb250aChtb20ueWVhcigpLCB2YWx1ZSkpO1xyXG4gICAgICAgIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyAnTW9udGgnXSh2YWx1ZSwgZGF5T2ZNb250aCk7XHJcbiAgICAgICAgcmV0dXJuIG1vbTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByYXdHZXR0ZXIobW9tLCB1bml0KSB7XHJcbiAgICAgICAgcmV0dXJuIG1vbS5fZFsnZ2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJhd1NldHRlcihtb20sIHVuaXQsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHVuaXQgPT09ICdNb250aCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJhd01vbnRoU2V0dGVyKG1vbSwgdmFsdWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb20uX2RbJ3NldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgdW5pdF0odmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlQWNjZXNzb3IodW5pdCwga2VlcFRpbWUpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByYXdTZXR0ZXIodGhpcywgdW5pdCwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgbW9tZW50LnVwZGF0ZU9mZnNldCh0aGlzLCBrZWVwVGltZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByYXdHZXR0ZXIodGhpcywgdW5pdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIG1vbWVudC5mbi5taWxsaXNlY29uZCA9IG1vbWVudC5mbi5taWxsaXNlY29uZHMgPSBtYWtlQWNjZXNzb3IoJ01pbGxpc2Vjb25kcycsIGZhbHNlKTtcclxuICAgIG1vbWVudC5mbi5zZWNvbmQgPSBtb21lbnQuZm4uc2Vjb25kcyA9IG1ha2VBY2Nlc3NvcignU2Vjb25kcycsIGZhbHNlKTtcclxuICAgIG1vbWVudC5mbi5taW51dGUgPSBtb21lbnQuZm4ubWludXRlcyA9IG1ha2VBY2Nlc3NvcignTWludXRlcycsIGZhbHNlKTtcclxuICAgIC8vIFNldHRpbmcgdGhlIGhvdXIgc2hvdWxkIGtlZXAgdGhlIHRpbWUsIGJlY2F1c2UgdGhlIHVzZXIgZXhwbGljaXRseVxyXG4gICAgLy8gc3BlY2lmaWVkIHdoaWNoIGhvdXIgaGUgd2FudHMuIFNvIHRyeWluZyB0byBtYWludGFpbiB0aGUgc2FtZSBob3VyIChpblxyXG4gICAgLy8gYSBuZXcgdGltZXpvbmUpIG1ha2VzIHNlbnNlLiBBZGRpbmcvc3VidHJhY3RpbmcgaG91cnMgZG9lcyBub3QgZm9sbG93XHJcbiAgICAvLyB0aGlzIHJ1bGUuXHJcbiAgICBtb21lbnQuZm4uaG91ciA9IG1vbWVudC5mbi5ob3VycyA9IG1ha2VBY2Nlc3NvcignSG91cnMnLCB0cnVlKTtcclxuICAgIC8vIG1vbWVudC5mbi5tb250aCBpcyBkZWZpbmVkIHNlcGFyYXRlbHlcclxuICAgIG1vbWVudC5mbi5kYXRlID0gbWFrZUFjY2Vzc29yKCdEYXRlJywgdHJ1ZSk7XHJcbiAgICBtb21lbnQuZm4uZGF0ZXMgPSBkZXByZWNhdGUoXCJkYXRlcyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgZGF0ZSBpbnN0ZWFkLlwiLCBtYWtlQWNjZXNzb3IoJ0RhdGUnLCB0cnVlKSk7XHJcbiAgICBtb21lbnQuZm4ueWVhciA9IG1ha2VBY2Nlc3NvcignRnVsbFllYXInLCB0cnVlKTtcclxuICAgIG1vbWVudC5mbi55ZWFycyA9IGRlcHJlY2F0ZShcInllYXJzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSB5ZWFyIGluc3RlYWQuXCIsIG1ha2VBY2Nlc3NvcignRnVsbFllYXInLCB0cnVlKSk7XHJcblxyXG4gICAgLy8gYWRkIHBsdXJhbCBtZXRob2RzXHJcbiAgICBtb21lbnQuZm4uZGF5cyA9IG1vbWVudC5mbi5kYXk7XHJcbiAgICBtb21lbnQuZm4ubW9udGhzID0gbW9tZW50LmZuLm1vbnRoO1xyXG4gICAgbW9tZW50LmZuLndlZWtzID0gbW9tZW50LmZuLndlZWs7XHJcbiAgICBtb21lbnQuZm4uaXNvV2Vla3MgPSBtb21lbnQuZm4uaXNvV2VlaztcclxuICAgIG1vbWVudC5mbi5xdWFydGVycyA9IG1vbWVudC5mbi5xdWFydGVyO1xyXG5cclxuICAgIC8vIGFkZCBhbGlhc2VkIGZvcm1hdCBtZXRob2RzXHJcbiAgICBtb21lbnQuZm4udG9KU09OID0gbW9tZW50LmZuLnRvSVNPU3RyaW5nO1xyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBEdXJhdGlvbiBQcm90b3R5cGVcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgZXh0ZW5kKG1vbWVudC5kdXJhdGlvbi5mbiA9IER1cmF0aW9uLnByb3RvdHlwZSwge1xyXG5cclxuICAgICAgICBfYnViYmxlIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgbWlsbGlzZWNvbmRzID0gdGhpcy5fbWlsbGlzZWNvbmRzLFxyXG4gICAgICAgICAgICAgICAgZGF5cyA9IHRoaXMuX2RheXMsXHJcbiAgICAgICAgICAgICAgICBtb250aHMgPSB0aGlzLl9tb250aHMsXHJcbiAgICAgICAgICAgICAgICBkYXRhID0gdGhpcy5fZGF0YSxcclxuICAgICAgICAgICAgICAgIHNlY29uZHMsIG1pbnV0ZXMsIGhvdXJzLCB5ZWFycztcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgY29kZSBidWJibGVzIHVwIHZhbHVlcywgc2VlIHRoZSB0ZXN0cyBmb3JcclxuICAgICAgICAgICAgLy8gZXhhbXBsZXMgb2Ygd2hhdCB0aGF0IG1lYW5zLlxyXG4gICAgICAgICAgICBkYXRhLm1pbGxpc2Vjb25kcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDA7XHJcblxyXG4gICAgICAgICAgICBzZWNvbmRzID0gYWJzUm91bmQobWlsbGlzZWNvbmRzIC8gMTAwMCk7XHJcbiAgICAgICAgICAgIGRhdGEuc2Vjb25kcyA9IHNlY29uZHMgJSA2MDtcclxuXHJcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBhYnNSb3VuZChzZWNvbmRzIC8gNjApO1xyXG4gICAgICAgICAgICBkYXRhLm1pbnV0ZXMgPSBtaW51dGVzICUgNjA7XHJcblxyXG4gICAgICAgICAgICBob3VycyA9IGFic1JvdW5kKG1pbnV0ZXMgLyA2MCk7XHJcbiAgICAgICAgICAgIGRhdGEuaG91cnMgPSBob3VycyAlIDI0O1xyXG5cclxuICAgICAgICAgICAgZGF5cyArPSBhYnNSb3VuZChob3VycyAvIDI0KTtcclxuICAgICAgICAgICAgZGF0YS5kYXlzID0gZGF5cyAlIDMwO1xyXG5cclxuICAgICAgICAgICAgbW9udGhzICs9IGFic1JvdW5kKGRheXMgLyAzMCk7XHJcbiAgICAgICAgICAgIGRhdGEubW9udGhzID0gbW9udGhzICUgMTI7XHJcblxyXG4gICAgICAgICAgICB5ZWFycyA9IGFic1JvdW5kKG1vbnRocyAvIDEyKTtcclxuICAgICAgICAgICAgZGF0YS55ZWFycyA9IHllYXJzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHdlZWtzIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWJzUm91bmQodGhpcy5kYXlzKCkgLyA3KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB2YWx1ZU9mIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWlsbGlzZWNvbmRzICtcclxuICAgICAgICAgICAgICB0aGlzLl9kYXlzICogODY0ZTUgK1xyXG4gICAgICAgICAgICAgICh0aGlzLl9tb250aHMgJSAxMikgKiAyNTkyZTYgK1xyXG4gICAgICAgICAgICAgIHRvSW50KHRoaXMuX21vbnRocyAvIDEyKSAqIDMxNTM2ZTY7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaHVtYW5pemUgOiBmdW5jdGlvbiAod2l0aFN1ZmZpeCkge1xyXG4gICAgICAgICAgICB2YXIgZGlmZmVyZW5jZSA9ICt0aGlzLFxyXG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gcmVsYXRpdmVUaW1lKGRpZmZlcmVuY2UsICF3aXRoU3VmZml4LCB0aGlzLmxhbmcoKSk7XHJcblxyXG4gICAgICAgICAgICBpZiAod2l0aFN1ZmZpeCkge1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gdGhpcy5sYW5nKCkucGFzdEZ1dHVyZShkaWZmZXJlbmNlLCBvdXRwdXQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkucG9zdGZvcm1hdChvdXRwdXQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFkZCA6IGZ1bmN0aW9uIChpbnB1dCwgdmFsKSB7XHJcbiAgICAgICAgICAgIC8vIHN1cHBvcnRzIG9ubHkgMi4wLXN0eWxlIGFkZCgxLCAncycpIG9yIGFkZChtb21lbnQpXHJcbiAgICAgICAgICAgIHZhciBkdXIgPSBtb21lbnQuZHVyYXRpb24oaW5wdXQsIHZhbCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9taWxsaXNlY29uZHMgKz0gZHVyLl9taWxsaXNlY29uZHM7XHJcbiAgICAgICAgICAgIHRoaXMuX2RheXMgKz0gZHVyLl9kYXlzO1xyXG4gICAgICAgICAgICB0aGlzLl9tb250aHMgKz0gZHVyLl9tb250aHM7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9idWJibGUoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN1YnRyYWN0IDogZnVuY3Rpb24gKGlucHV0LCB2YWwpIHtcclxuICAgICAgICAgICAgdmFyIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyAtPSBkdXIuX21pbGxpc2Vjb25kcztcclxuICAgICAgICAgICAgdGhpcy5fZGF5cyAtPSBkdXIuX2RheXM7XHJcbiAgICAgICAgICAgIHRoaXMuX21vbnRocyAtPSBkdXIuX21vbnRocztcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2J1YmJsZSgpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0IDogZnVuY3Rpb24gKHVuaXRzKSB7XHJcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1t1bml0cy50b0xvd2VyQ2FzZSgpICsgJ3MnXSgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFzIDogZnVuY3Rpb24gKHVuaXRzKSB7XHJcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1snYXMnICsgdW5pdHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB1bml0cy5zbGljZSgxKSArICdzJ10oKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsYW5nIDogbW9tZW50LmZuLmxhbmcsXHJcblxyXG4gICAgICAgIHRvSXNvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vZG9yZGlsbGUvbW9tZW50LWlzb2R1cmF0aW9uL2Jsb2IvbWFzdGVyL21vbWVudC5pc29kdXJhdGlvbi5qc1xyXG4gICAgICAgICAgICB2YXIgeWVhcnMgPSBNYXRoLmFicyh0aGlzLnllYXJzKCkpLFxyXG4gICAgICAgICAgICAgICAgbW9udGhzID0gTWF0aC5hYnModGhpcy5tb250aHMoKSksXHJcbiAgICAgICAgICAgICAgICBkYXlzID0gTWF0aC5hYnModGhpcy5kYXlzKCkpLFxyXG4gICAgICAgICAgICAgICAgaG91cnMgPSBNYXRoLmFicyh0aGlzLmhvdXJzKCkpLFxyXG4gICAgICAgICAgICAgICAgbWludXRlcyA9IE1hdGguYWJzKHRoaXMubWludXRlcygpKSxcclxuICAgICAgICAgICAgICAgIHNlY29uZHMgPSBNYXRoLmFicyh0aGlzLnNlY29uZHMoKSArIHRoaXMubWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hc1NlY29uZHMoKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB0aGUgc2FtZSBhcyBDIydzIChOb2RhKSBhbmQgcHl0aG9uIChpc29kYXRlKS4uLlxyXG4gICAgICAgICAgICAgICAgLy8gYnV0IG5vdCBvdGhlciBKUyAoZ29vZy5kYXRlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICdQMEQnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuYXNTZWNvbmRzKCkgPCAwID8gJy0nIDogJycpICtcclxuICAgICAgICAgICAgICAgICdQJyArXHJcbiAgICAgICAgICAgICAgICAoeWVhcnMgPyB5ZWFycyArICdZJyA6ICcnKSArXHJcbiAgICAgICAgICAgICAgICAobW9udGhzID8gbW9udGhzICsgJ00nIDogJycpICtcclxuICAgICAgICAgICAgICAgIChkYXlzID8gZGF5cyArICdEJyA6ICcnKSArXHJcbiAgICAgICAgICAgICAgICAoKGhvdXJzIHx8IG1pbnV0ZXMgfHwgc2Vjb25kcykgPyAnVCcgOiAnJykgK1xyXG4gICAgICAgICAgICAgICAgKGhvdXJzID8gaG91cnMgKyAnSCcgOiAnJykgK1xyXG4gICAgICAgICAgICAgICAgKG1pbnV0ZXMgPyBtaW51dGVzICsgJ00nIDogJycpICtcclxuICAgICAgICAgICAgICAgIChzZWNvbmRzID8gc2Vjb25kcyArICdTJyA6ICcnKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlRHVyYXRpb25HZXR0ZXIobmFtZSkge1xyXG4gICAgICAgIG1vbWVudC5kdXJhdGlvbi5mbltuYW1lXSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFbbmFtZV07XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlRHVyYXRpb25Bc0dldHRlcihuYW1lLCBmYWN0b3IpIHtcclxuICAgICAgICBtb21lbnQuZHVyYXRpb24uZm5bJ2FzJyArIG5hbWVdID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gK3RoaXMgLyBmYWN0b3I7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGkgaW4gdW5pdE1pbGxpc2Vjb25kRmFjdG9ycykge1xyXG4gICAgICAgIGlmICh1bml0TWlsbGlzZWNvbmRGYWN0b3JzLmhhc093blByb3BlcnR5KGkpKSB7XHJcbiAgICAgICAgICAgIG1ha2VEdXJhdGlvbkFzR2V0dGVyKGksIHVuaXRNaWxsaXNlY29uZEZhY3RvcnNbaV0pO1xyXG4gICAgICAgICAgICBtYWtlRHVyYXRpb25HZXR0ZXIoaS50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWFrZUR1cmF0aW9uQXNHZXR0ZXIoJ1dlZWtzJywgNjA0OGU1KTtcclxuICAgIG1vbWVudC5kdXJhdGlvbi5mbi5hc01vbnRocyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCt0aGlzIC0gdGhpcy55ZWFycygpICogMzE1MzZlNikgLyAyNTkyZTYgKyB0aGlzLnllYXJzKCkgKiAxMjtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBEZWZhdWx0IExhbmdcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgLy8gU2V0IGRlZmF1bHQgbGFuZ3VhZ2UsIG90aGVyIGxhbmd1YWdlcyB3aWxsIGluaGVyaXQgZnJvbSBFbmdsaXNoLlxyXG4gICAgbW9tZW50LmxhbmcoJ2VuJywge1xyXG4gICAgICAgIG9yZGluYWwgOiBmdW5jdGlvbiAobnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBiID0gbnVtYmVyICUgMTAsXHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSAodG9JbnQobnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/ICd0aCcgOlxyXG4gICAgICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XHJcbiAgICAgICAgICAgICAgICAoYiA9PT0gMikgPyAnbmQnIDpcclxuICAgICAgICAgICAgICAgIChiID09PSAzKSA/ICdyZCcgOiAndGgnO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyICsgb3V0cHV0O1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8qIEVNQkVEX0xBTkdVQUdFUyAqL1xyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBFeHBvc2luZyBNb21lbnRcclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlR2xvYmFsKHNob3VsZERlcHJlY2F0ZSkge1xyXG4gICAgICAgIC8qZ2xvYmFsIGVuZGVyOmZhbHNlICovXHJcbiAgICAgICAgaWYgKHR5cGVvZiBlbmRlciAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvbGRHbG9iYWxNb21lbnQgPSBnbG9iYWxTY29wZS5tb21lbnQ7XHJcbiAgICAgICAgaWYgKHNob3VsZERlcHJlY2F0ZSkge1xyXG4gICAgICAgICAgICBnbG9iYWxTY29wZS5tb21lbnQgPSBkZXByZWNhdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJBY2Nlc3NpbmcgTW9tZW50IHRocm91Z2ggdGhlIGdsb2JhbCBzY29wZSBpcyBcIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCJkZXByZWNhdGVkLCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIGFuIHVwY29taW5nIFwiICtcclxuICAgICAgICAgICAgICAgICAgICBcInJlbGVhc2UuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9tZW50KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnbG9iYWxTY29wZS5tb21lbnQgPSBtb21lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbW1vbkpTIG1vZHVsZSBpcyBkZWZpbmVkXHJcbiAgICBpZiAoaGFzTW9kdWxlKSB7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBtb21lbnQ7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFwibW9tZW50XCIsIGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcclxuICAgICAgICAgICAgaWYgKG1vZHVsZS5jb25maWcgJiYgbW9kdWxlLmNvbmZpZygpICYmIG1vZHVsZS5jb25maWcoKS5ub0dsb2JhbCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gcmVsZWFzZSB0aGUgZ2xvYmFsIHZhcmlhYmxlXHJcbiAgICAgICAgICAgICAgICBnbG9iYWxTY29wZS5tb21lbnQgPSBvbGRHbG9iYWxNb21lbnQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQ7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgbWFrZUdsb2JhbCh0cnVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbWFrZUdsb2JhbCgpO1xyXG4gICAgfVxyXG59KS5jYWxsKHRoaXMpO1xyXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuNi4yXHJcbihmdW5jdGlvbigpIHtcclxuICB2YXIgZGVwcmVjYXRlLCBoYXNNb2R1bGUsIG1ha2VUd2l4LFxyXG4gICAgX19zbGljZSA9IFtdLnNsaWNlO1xyXG5cclxuICBoYXNNb2R1bGUgPSAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwpICYmIChtb2R1bGUuZXhwb3J0cyAhPSBudWxsKTtcclxuXHJcbiAgZGVwcmVjYXRlID0gZnVuY3Rpb24obmFtZSwgaW5zdGVhZCwgZm4pIHtcclxuICAgIHZhciBhbHJlYWR5RG9uZTtcclxuXHJcbiAgICBhbHJlYWR5RG9uZSA9IGZhbHNlO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYXJncztcclxuXHJcbiAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xyXG4gICAgICBpZiAoIWFscmVhZHlEb25lKSB7XHJcbiAgICAgICAgaWYgKCh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjb25zb2xlICE9PSBudWxsKSAmJiAoY29uc29sZS53YXJuICE9IG51bGwpKSB7XHJcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCIjXCIgKyBuYW1lICsgXCIgaXMgZGVwcmVjYXRlZC4gVXNlICNcIiArIGluc3RlYWQgKyBcIiBpbnN0ZWFkLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgYWxyZWFkeURvbmUgPSB0cnVlO1xyXG4gICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIG1ha2VUd2l4ID0gZnVuY3Rpb24obW9tZW50KSB7XHJcbiAgICB2YXIgVHdpeCwgZ2V0UHJvdG90eXBlT2YsIGxhbmd1YWdlc0xvYWRlZDtcclxuXHJcbiAgICBpZiAobW9tZW50ID09IG51bGwpIHtcclxuICAgICAgdGhyb3cgXCJDYW4ndCBmaW5kIG1vbWVudFwiO1xyXG4gICAgfVxyXG4gICAgbGFuZ3VhZ2VzTG9hZGVkID0gZmFsc2U7XHJcbiAgICBUd2l4ID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgICBmdW5jdGlvbiBUd2l4KHN0YXJ0LCBlbmQsIHBhcnNlRm9ybWF0LCBvcHRpb25zKSB7XHJcbiAgICAgICAgdmFyIF9yZWY7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcclxuICAgICAgICAgIG9wdGlvbnMgPSB7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJzZUZvcm1hdCAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgb3B0aW9ucyA9IHBhcnNlRm9ybWF0ICE9IG51bGwgPyBwYXJzZUZvcm1hdCA6IHt9O1xyXG4gICAgICAgICAgcGFyc2VGb3JtYXQgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgICBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICBhbGxEYXk6IG9wdGlvbnNcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RhcnQgPSBtb21lbnQoc3RhcnQsIHBhcnNlRm9ybWF0LCBvcHRpb25zLnBhcnNlU3RyaWN0KTtcclxuICAgICAgICB0aGlzLmVuZCA9IG1vbWVudChlbmQsIHBhcnNlRm9ybWF0LCBvcHRpb25zLnBhcnNlU3RyaWN0KTtcclxuICAgICAgICB0aGlzLmFsbERheSA9IChfcmVmID0gb3B0aW9ucy5hbGxEYXkpICE9IG51bGwgPyBfcmVmIDogZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFR3aXguX2V4dGVuZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBhdHRyLCBmaXJzdCwgb3RoZXIsIG90aGVycywgX2ksIF9sZW47XHJcblxyXG4gICAgICAgIGZpcnN0ID0gYXJndW1lbnRzWzBdLCBvdGhlcnMgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xyXG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gb3RoZXJzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XHJcbiAgICAgICAgICBvdGhlciA9IG90aGVyc1tfaV07XHJcbiAgICAgICAgICBmb3IgKGF0dHIgaW4gb3RoZXIpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvdGhlclthdHRyXSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgIGZpcnN0W2F0dHJdID0gb3RoZXJbYXR0cl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZpcnN0O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5kZWZhdWx0cyA9IHtcclxuICAgICAgICB0d2VudHlGb3VySG91cjogZmFsc2UsXHJcbiAgICAgICAgYWxsRGF5U2ltcGxlOiB7XHJcbiAgICAgICAgICBmbjogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuYWxsRGF5O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNsb3Q6IDAsXHJcbiAgICAgICAgICBwcmU6IFwiIFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkYXlPZldlZWs6IHtcclxuICAgICAgICAgIGZuOiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRhdGUuZm9ybWF0KG9wdGlvbnMud2Vla2RheUZvcm1hdCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2xvdDogMSxcclxuICAgICAgICAgIHByZTogXCIgXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFsbERheU1vbnRoOiB7XHJcbiAgICAgICAgICBmbjogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkYXRlLmZvcm1hdChcIlwiICsgb3B0aW9ucy5tb250aEZvcm1hdCArIFwiIFwiICsgb3B0aW9ucy5kYXlGb3JtYXQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNsb3Q6IDIsXHJcbiAgICAgICAgICBwcmU6IFwiIFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBtb250aDoge1xyXG4gICAgICAgICAgZm46IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGF0ZS5mb3JtYXQob3B0aW9ucy5tb250aEZvcm1hdCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2xvdDogMixcclxuICAgICAgICAgIHByZTogXCIgXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRhdGU6IHtcclxuICAgICAgICAgIGZuOiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRhdGUuZm9ybWF0KG9wdGlvbnMuZGF5Rm9ybWF0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbG90OiAzLFxyXG4gICAgICAgICAgcHJlOiBcIiBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgeWVhcjoge1xyXG4gICAgICAgICAgZm46IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGF0ZS5mb3JtYXQob3B0aW9ucy55ZWFyRm9ybWF0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbG90OiA0LFxyXG4gICAgICAgICAgcHJlOiBcIiwgXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRpbWU6IHtcclxuICAgICAgICAgIGZuOiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgICAgICAgdmFyIHN0cjtcclxuXHJcbiAgICAgICAgICAgICAgc3RyID0gZGF0ZS5taW51dGVzKCkgPT09IDAgJiYgb3B0aW9ucy5pbXBsaWNpdE1pbnV0ZXMgJiYgIW9wdGlvbnMudHdlbnR5Rm91ckhvdXIgPyBkYXRlLmZvcm1hdChvcHRpb25zLmhvdXJGb3JtYXQpIDogZGF0ZS5mb3JtYXQoXCJcIiArIG9wdGlvbnMuaG91ckZvcm1hdCArIFwiOlwiICsgb3B0aW9ucy5taW51dGVGb3JtYXQpO1xyXG4gICAgICAgICAgICAgIGlmICghb3B0aW9ucy5ncm91cE1lcmlkaWVtcyAmJiAhb3B0aW9ucy50d2VudHlGb3VySG91cikge1xyXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3BhY2VCZWZvcmVNZXJpZGllbSkge1xyXG4gICAgICAgICAgICAgICAgICBzdHIgKz0gXCIgXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdHIgKz0gZGF0ZS5mb3JtYXQob3B0aW9ucy5tZXJpZGllbUZvcm1hdCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2xvdDogNSxcclxuICAgICAgICAgIHByZTogXCIsIFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBtZXJpZGllbToge1xyXG4gICAgICAgICAgZm46IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbih0KSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHQuZm9ybWF0KG9wdGlvbnMubWVyaWRpZW1Gb3JtYXQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNsb3Q6IDYsXHJcbiAgICAgICAgICBwcmU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3BhY2VCZWZvcmVNZXJpZGllbSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBcIiBcIjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucmVnaXN0ZXJMYW5nID0gZnVuY3Rpb24obmFtZSwgb3B0aW9ucykge1xyXG4gICAgICAgIHJldHVybiBtb21lbnQubGFuZyhuYW1lLCB7XHJcbiAgICAgICAgICB0d2l4OiBUd2l4Ll9leHRlbmQoe30sIFR3aXguZGVmYXVsdHMsIG9wdGlvbnMpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5pc1NhbWUgPSBmdW5jdGlvbihwZXJpb2QpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGFydC5pc1NhbWUodGhpcy5lbmQsIHBlcmlvZCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbihwZXJpb2QpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdHJ1ZUVuZCh0cnVlKS5kaWZmKHRoaXMuX3RydWVTdGFydCgpLCBwZXJpb2QpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbihwZXJpb2QpIHtcclxuICAgICAgICB2YXIgZW5kLCBzdGFydDtcclxuXHJcbiAgICAgICAgc3RhcnQgPSB0aGlzLnN0YXJ0LmNsb25lKCkuc3RhcnRPZihwZXJpb2QpO1xyXG4gICAgICAgIGVuZCA9IHRoaXMuZW5kLmNsb25lKCkuc3RhcnRPZihwZXJpb2QpO1xyXG4gICAgICAgIHJldHVybiBlbmQuZGlmZihzdGFydCwgcGVyaW9kKSArIDE7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5jb3VudElubmVyID0gZnVuY3Rpb24ocGVyaW9kKSB7XHJcbiAgICAgICAgdmFyIGVuZCwgc3RhcnQsIF9yZWY7XHJcblxyXG4gICAgICAgIF9yZWYgPSB0aGlzLl9pbm5lcihwZXJpb2QpLCBzdGFydCA9IF9yZWZbMF0sIGVuZCA9IF9yZWZbMV07XHJcbiAgICAgICAgaWYgKHN0YXJ0ID49IGVuZCkge1xyXG4gICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbmQuZGlmZihzdGFydCwgcGVyaW9kKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLml0ZXJhdGUgPSBmdW5jdGlvbihpbnRlcnZhbEFtb3VudCwgcGVyaW9kLCBtaW5Ib3Vycykge1xyXG4gICAgICAgIHZhciBlbmQsIGhhc05leHQsIHN0YXJ0LCBfcmVmLFxyXG4gICAgICAgICAgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoaW50ZXJ2YWxBbW91bnQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgaW50ZXJ2YWxBbW91bnQgPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfcmVmID0gdGhpcy5fcHJlcEl0ZXJhdGVJbnB1dHMoaW50ZXJ2YWxBbW91bnQsIHBlcmlvZCwgbWluSG91cnMpLCBpbnRlcnZhbEFtb3VudCA9IF9yZWZbMF0sIHBlcmlvZCA9IF9yZWZbMV0sIG1pbkhvdXJzID0gX3JlZlsyXTtcclxuICAgICAgICBzdGFydCA9IHRoaXMuc3RhcnQuY2xvbmUoKS5zdGFydE9mKHBlcmlvZCk7XHJcbiAgICAgICAgZW5kID0gdGhpcy5lbmQuY2xvbmUoKS5zdGFydE9mKHBlcmlvZCk7XHJcbiAgICAgICAgaGFzTmV4dCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHN0YXJ0IDw9IGVuZCAmJiAoIW1pbkhvdXJzIHx8IHN0YXJ0LnZhbHVlT2YoKSAhPT0gZW5kLnZhbHVlT2YoKSB8fCBfdGhpcy5lbmQuaG91cnMoKSA+IG1pbkhvdXJzIHx8IF90aGlzLmFsbERheSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZUhlbHBlcihwZXJpb2QsIHN0YXJ0LCBoYXNOZXh0LCBpbnRlcnZhbEFtb3VudCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5pdGVyYXRlSW5uZXIgPSBmdW5jdGlvbihpbnRlcnZhbEFtb3VudCwgcGVyaW9kKSB7XHJcbiAgICAgICAgdmFyIGVuZCwgaGFzTmV4dCwgc3RhcnQsIF9yZWYsIF9yZWYxO1xyXG5cclxuICAgICAgICBpZiAoaW50ZXJ2YWxBbW91bnQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgaW50ZXJ2YWxBbW91bnQgPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfcmVmID0gdGhpcy5fcHJlcEl0ZXJhdGVJbnB1dHMoaW50ZXJ2YWxBbW91bnQsIHBlcmlvZCksIGludGVydmFsQW1vdW50ID0gX3JlZlswXSwgcGVyaW9kID0gX3JlZlsxXTtcclxuICAgICAgICBfcmVmMSA9IHRoaXMuX2lubmVyKHBlcmlvZCwgaW50ZXJ2YWxBbW91bnQpLCBzdGFydCA9IF9yZWYxWzBdLCBlbmQgPSBfcmVmMVsxXTtcclxuICAgICAgICBoYXNOZXh0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gc3RhcnQgPCBlbmQ7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZUhlbHBlcihwZXJpb2QsIHN0YXJ0LCBoYXNOZXh0LCBpbnRlcnZhbEFtb3VudCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5odW1hbml6ZUxlbmd0aCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmFsbERheSkge1xyXG4gICAgICAgICAgaWYgKHRoaXMuaXNTYW1lKFwiZGF5XCIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcImFsbCBkYXlcIjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0LmZyb20odGhpcy5lbmQuY2xvbmUoKS5hZGQoMSwgXCJkYXlcIiksIHRydWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5zdGFydC5mcm9tKHRoaXMuZW5kLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5hc0R1cmF0aW9uID0gZnVuY3Rpb24odW5pdHMpIHtcclxuICAgICAgICB2YXIgZGlmZjtcclxuXHJcbiAgICAgICAgZGlmZiA9IHRoaXMuZW5kLmRpZmYodGhpcy5zdGFydCk7XHJcbiAgICAgICAgcmV0dXJuIG1vbWVudC5kdXJhdGlvbihkaWZmKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmlzUGFzdCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmFsbERheSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZW5kLmNsb25lKCkuZW5kT2YoXCJkYXlcIikgPCBtb21lbnQoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZW5kIDwgbW9tZW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuaXNGdXR1cmUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5hbGxEYXkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0LmNsb25lKCkuc3RhcnRPZihcImRheVwiKSA+IG1vbWVudCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5zdGFydCA+IG1vbWVudCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmlzQ3VycmVudCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAhdGhpcy5pc1Bhc3QoKSAmJiAhdGhpcy5pc0Z1dHVyZSgpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbihtb20pIHtcclxuICAgICAgICBtb20gPSBtb21lbnQobW9tKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdHJ1ZVN0YXJ0KCkgPD0gbW9tICYmIHRoaXMuX3RydWVFbmQoKSA+PSBtb207XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5pc0VtcHR5ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RydWVTdGFydCgpLnZhbHVlT2YoKSA9PT0gdGhpcy5fdHJ1ZUVuZCgpLnZhbHVlT2YoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLm92ZXJsYXBzID0gZnVuY3Rpb24ob3RoZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdHJ1ZUVuZCgpLmlzQWZ0ZXIob3RoZXIuX3RydWVTdGFydCgpKSAmJiB0aGlzLl90cnVlU3RhcnQoKS5pc0JlZm9yZShvdGhlci5fdHJ1ZUVuZCgpKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmVuZ3VsZnMgPSBmdW5jdGlvbihvdGhlcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90cnVlU3RhcnQoKSA8PSBvdGhlci5fdHJ1ZVN0YXJ0KCkgJiYgdGhpcy5fdHJ1ZUVuZCgpID49IG90aGVyLl90cnVlRW5kKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS51bmlvbiA9IGZ1bmN0aW9uKG90aGVyKSB7XHJcbiAgICAgICAgdmFyIGFsbERheSwgbmV3RW5kLCBuZXdTdGFydDtcclxuXHJcbiAgICAgICAgYWxsRGF5ID0gdGhpcy5hbGxEYXkgJiYgb3RoZXIuYWxsRGF5O1xyXG4gICAgICAgIGlmIChhbGxEYXkpIHtcclxuICAgICAgICAgIG5ld1N0YXJ0ID0gdGhpcy5zdGFydCA8IG90aGVyLnN0YXJ0ID8gdGhpcy5zdGFydCA6IG90aGVyLnN0YXJ0O1xyXG4gICAgICAgICAgbmV3RW5kID0gdGhpcy5lbmQgPiBvdGhlci5lbmQgPyB0aGlzLmVuZCA6IG90aGVyLmVuZDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbmV3U3RhcnQgPSB0aGlzLl90cnVlU3RhcnQoKSA8IG90aGVyLl90cnVlU3RhcnQoKSA/IHRoaXMuX3RydWVTdGFydCgpIDogb3RoZXIuX3RydWVTdGFydCgpO1xyXG4gICAgICAgICAgbmV3RW5kID0gdGhpcy5fdHJ1ZUVuZCgpID4gb3RoZXIuX3RydWVFbmQoKSA/IHRoaXMuX3RydWVFbmQoKSA6IG90aGVyLl90cnVlRW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcgVHdpeChuZXdTdGFydCwgbmV3RW5kLCBhbGxEYXkpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24ob3RoZXIpIHtcclxuICAgICAgICB2YXIgYWxsRGF5LCBlbmQsIG5ld0VuZCwgbmV3U3RhcnQ7XHJcblxyXG4gICAgICAgIG5ld1N0YXJ0ID0gdGhpcy5zdGFydCA+IG90aGVyLnN0YXJ0ID8gdGhpcy5zdGFydCA6IG90aGVyLnN0YXJ0O1xyXG4gICAgICAgIGlmICh0aGlzLmFsbERheSkge1xyXG4gICAgICAgICAgZW5kID0gbW9tZW50KHRoaXMuZW5kKTtcclxuICAgICAgICAgIGVuZC5hZGQoMSwgXCJkYXlcIik7XHJcbiAgICAgICAgICBlbmQuc3VidHJhY3QoMSwgXCJtaWxsaXNlY29uZFwiKTtcclxuICAgICAgICAgIGlmIChvdGhlci5hbGxEYXkpIHtcclxuICAgICAgICAgICAgbmV3RW5kID0gZW5kIDwgb3RoZXIuZW5kID8gdGhpcy5lbmQgOiBvdGhlci5lbmQ7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBuZXdFbmQgPSBlbmQgPCBvdGhlci5lbmQgPyBlbmQgOiBvdGhlci5lbmQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG5ld0VuZCA9IHRoaXMuZW5kIDwgb3RoZXIuZW5kID8gdGhpcy5lbmQgOiBvdGhlci5lbmQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFsbERheSA9IHRoaXMuYWxsRGF5ICYmIG90aGVyLmFsbERheTtcclxuICAgICAgICByZXR1cm4gbmV3IFR3aXgobmV3U3RhcnQsIG5ld0VuZCwgYWxsRGF5KTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmlzVmFsaWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdHJ1ZVN0YXJ0KCkgPD0gdGhpcy5fdHJ1ZUVuZCgpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24ob3RoZXIpIHtcclxuICAgICAgICByZXR1cm4gKG90aGVyIGluc3RhbmNlb2YgVHdpeCkgJiYgdGhpcy5hbGxEYXkgPT09IG90aGVyLmFsbERheSAmJiB0aGlzLnN0YXJ0LnZhbHVlT2YoKSA9PT0gb3RoZXIuc3RhcnQudmFsdWVPZigpICYmIHRoaXMuZW5kLnZhbHVlT2YoKSA9PT0gb3RoZXIuZW5kLnZhbHVlT2YoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIF9yZWY7XHJcblxyXG4gICAgICAgIHJldHVybiBcIntzdGFydDogXCIgKyAodGhpcy5zdGFydC5mb3JtYXQoKSkgKyBcIiwgZW5kOiBcIiArICh0aGlzLmVuZC5mb3JtYXQoKSkgKyBcIiwgYWxsRGF5OiBcIiArICgoX3JlZiA9IHRoaXMuYWxsRGF5KSAhPSBudWxsID8gX3JlZiA6IHtcclxuICAgICAgICAgIFwidHJ1ZVwiOiBcImZhbHNlXCJcclxuICAgICAgICB9KSArIFwifVwiO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuc2ltcGxlRm9ybWF0ID0gZnVuY3Rpb24obW9tZW50T3B0cywgaW5vcHRzKSB7XHJcbiAgICAgICAgdmFyIG9wdGlvbnMsIHM7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICBhbGxEYXk6IFwiKGFsbCBkYXkpXCIsXHJcbiAgICAgICAgICB0ZW1wbGF0ZTogVHdpeC5mb3JtYXRUZW1wbGF0ZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgVHdpeC5fZXh0ZW5kKG9wdGlvbnMsIGlub3B0cyB8fCB7fSk7XHJcbiAgICAgICAgcyA9IG9wdGlvbnMudGVtcGxhdGUodGhpcy5zdGFydC5mb3JtYXQobW9tZW50T3B0cyksIHRoaXMuZW5kLmZvcm1hdChtb21lbnRPcHRzKSk7XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRGF5ICYmIG9wdGlvbnMuYWxsRGF5KSB7XHJcbiAgICAgICAgICBzICs9IFwiIFwiICsgb3B0aW9ucy5hbGxEYXk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuZm9ybWF0ID0gZnVuY3Rpb24oaW5vcHRzKSB7XHJcbiAgICAgICAgdmFyIGNvbW1vbl9idWNrZXQsIGVuZF9idWNrZXQsIGZvbGQsIGZvcm1hdCwgZnMsIGdsb2JhbF9maXJzdCwgZ29lc0ludG9UaGVNb3JuaW5nLCBuZWVkRGF0ZSwgb3B0aW9ucywgcHJvY2Vzcywgc3RhcnRfYnVja2V0LCB0b2dldGhlciwgX2ksIF9sZW4sXHJcbiAgICAgICAgICBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuX2xhenlMYW5nKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNFbXB0eSgpKSB7XHJcbiAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3B0aW9ucyA9IHtcclxuICAgICAgICAgIGdyb3VwTWVyaWRpZW1zOiB0cnVlLFxyXG4gICAgICAgICAgc3BhY2VCZWZvcmVNZXJpZGllbTogdHJ1ZSxcclxuICAgICAgICAgIHNob3dEYXRlOiB0cnVlLFxyXG4gICAgICAgICAgc2hvd0RheU9mV2VlazogZmFsc2UsXHJcbiAgICAgICAgICB0d2VudHlGb3VySG91cjogdGhpcy5sYW5nRGF0YS50d2VudHlGb3VySG91cixcclxuICAgICAgICAgIGltcGxpY2l0TWludXRlczogdHJ1ZSxcclxuICAgICAgICAgIGltcGxpY2l0WWVhcjogdHJ1ZSxcclxuICAgICAgICAgIHllYXJGb3JtYXQ6IFwiWVlZWVwiLFxyXG4gICAgICAgICAgbW9udGhGb3JtYXQ6IFwiTU1NXCIsXHJcbiAgICAgICAgICB3ZWVrZGF5Rm9ybWF0OiBcImRkZFwiLFxyXG4gICAgICAgICAgZGF5Rm9ybWF0OiBcIkRcIixcclxuICAgICAgICAgIG1lcmlkaWVtRm9ybWF0OiBcIkFcIixcclxuICAgICAgICAgIGhvdXJGb3JtYXQ6IFwiaFwiLFxyXG4gICAgICAgICAgbWludXRlRm9ybWF0OiBcIm1tXCIsXHJcbiAgICAgICAgICBhbGxEYXk6IFwiYWxsIGRheVwiLFxyXG4gICAgICAgICAgZXhwbGljaXRBbGxEYXk6IGZhbHNlLFxyXG4gICAgICAgICAgbGFzdE5pZ2h0RW5kc0F0OiAwLFxyXG4gICAgICAgICAgdGVtcGxhdGU6IFR3aXguZm9ybWF0VGVtcGxhdGVcclxuICAgICAgICB9O1xyXG4gICAgICAgIFR3aXguX2V4dGVuZChvcHRpb25zLCBpbm9wdHMgfHwge30pO1xyXG4gICAgICAgIGZzID0gW107XHJcbiAgICAgICAgaWYgKG9wdGlvbnMudHdlbnR5Rm91ckhvdXIpIHtcclxuICAgICAgICAgIG9wdGlvbnMuaG91ckZvcm1hdCA9IG9wdGlvbnMuaG91ckZvcm1hdC5yZXBsYWNlKFwiaFwiLCBcIkhcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdvZXNJbnRvVGhlTW9ybmluZyA9IG9wdGlvbnMubGFzdE5pZ2h0RW5kc0F0ID4gMCAmJiAhdGhpcy5hbGxEYXkgJiYgdGhpcy5lbmQuY2xvbmUoKS5zdGFydE9mKFwiZGF5XCIpLnZhbHVlT2YoKSA9PT0gdGhpcy5zdGFydC5jbG9uZSgpLmFkZCgxLCBcImRheVwiKS5zdGFydE9mKFwiZGF5XCIpLnZhbHVlT2YoKSAmJiB0aGlzLnN0YXJ0LmhvdXJzKCkgPiAxMiAmJiB0aGlzLmVuZC5ob3VycygpIDwgb3B0aW9ucy5sYXN0TmlnaHRFbmRzQXQ7XHJcbiAgICAgICAgbmVlZERhdGUgPSBvcHRpb25zLnNob3dEYXRlIHx8ICghdGhpcy5pc1NhbWUoXCJkYXlcIikgJiYgIWdvZXNJbnRvVGhlTW9ybmluZyk7XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRGF5ICYmIHRoaXMuaXNTYW1lKFwiZGF5XCIpICYmICghb3B0aW9ucy5zaG93RGF0ZSB8fCBvcHRpb25zLmV4cGxpY2l0QWxsRGF5KSkge1xyXG4gICAgICAgICAgZnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiYWxsIGRheSBzaW1wbGVcIixcclxuICAgICAgICAgICAgZm46IHRoaXMuX2Zvcm1hdEZuKCdhbGxEYXlTaW1wbGUnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgcHJlOiB0aGlzLl9mb3JtYXRQcmUoJ2FsbERheVNpbXBsZScsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBzbG90OiB0aGlzLl9mb3JtYXRTbG90KCdhbGxEYXlTaW1wbGUnKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuZWVkRGF0ZSAmJiAoIW9wdGlvbnMuaW1wbGljaXRZZWFyIHx8IHRoaXMuc3RhcnQueWVhcigpICE9PSBtb21lbnQoKS55ZWFyKCkgfHwgIXRoaXMuaXNTYW1lKFwieWVhclwiKSkpIHtcclxuICAgICAgICAgIGZzLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBcInllYXJcIixcclxuICAgICAgICAgICAgZm46IHRoaXMuX2Zvcm1hdEZuKCd5ZWFyJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHByZTogdGhpcy5fZm9ybWF0UHJlKCd5ZWFyJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHNsb3Q6IHRoaXMuX2Zvcm1hdFNsb3QoJ3llYXInKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5hbGxEYXkgJiYgbmVlZERhdGUpIHtcclxuICAgICAgICAgIGZzLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBcImFsbCBkYXkgbW9udGhcIixcclxuICAgICAgICAgICAgZm46IHRoaXMuX2Zvcm1hdEZuKCdhbGxEYXlNb250aCcsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBpZ25vcmVFbmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBnb2VzSW50b1RoZU1vcm5pbmc7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByZTogdGhpcy5fZm9ybWF0UHJlKCdhbGxEYXlNb250aCcsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBzbG90OiB0aGlzLl9mb3JtYXRTbG90KCdhbGxEYXlNb250aCcpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRGF5ICYmIG5lZWREYXRlKSB7XHJcbiAgICAgICAgICBmcy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogXCJtb250aFwiLFxyXG4gICAgICAgICAgICBmbjogdGhpcy5fZm9ybWF0Rm4oJ21vbnRoJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHByZTogdGhpcy5fZm9ybWF0UHJlKCdtb250aCcsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBzbG90OiB0aGlzLl9mb3JtYXRTbG90KCdtb250aCcpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRGF5ICYmIG5lZWREYXRlKSB7XHJcbiAgICAgICAgICBmcy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogXCJkYXRlXCIsXHJcbiAgICAgICAgICAgIGZuOiB0aGlzLl9mb3JtYXRGbignZGF0ZScsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBwcmU6IHRoaXMuX2Zvcm1hdFByZSgnZGF0ZScsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBzbG90OiB0aGlzLl9mb3JtYXRTbG90KCdkYXRlJylcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobmVlZERhdGUgJiYgb3B0aW9ucy5zaG93RGF5T2ZXZWVrKSB7XHJcbiAgICAgICAgICBmcy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogXCJkYXkgb2Ygd2Vla1wiLFxyXG4gICAgICAgICAgICBmbjogdGhpcy5fZm9ybWF0Rm4oJ2RheU9mV2VlaycsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBwcmU6IHRoaXMuX2Zvcm1hdFByZSgnZGF5T2ZXZWVrJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHNsb3Q6IHRoaXMuX2Zvcm1hdFNsb3QoJ2RheU9mV2VlaycpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ3JvdXBNZXJpZGllbXMgJiYgIW9wdGlvbnMudHdlbnR5Rm91ckhvdXIgJiYgIXRoaXMuYWxsRGF5KSB7XHJcbiAgICAgICAgICBmcy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogXCJtZXJpZGllbVwiLFxyXG4gICAgICAgICAgICBmbjogdGhpcy5fZm9ybWF0Rm4oJ21lcmlkaWVtJywgb3B0aW9ucyksXHJcbiAgICAgICAgICAgIHByZTogdGhpcy5fZm9ybWF0UHJlKCdtZXJpZGllbScsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICBzbG90OiB0aGlzLl9mb3JtYXRTbG90KCdtZXJpZGllbScpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmFsbERheSkge1xyXG4gICAgICAgICAgZnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IFwidGltZVwiLFxyXG4gICAgICAgICAgICBmbjogdGhpcy5fZm9ybWF0Rm4oJ3RpbWUnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgcHJlOiB0aGlzLl9mb3JtYXRQcmUoJ3RpbWUnLCBvcHRpb25zKSxcclxuICAgICAgICAgICAgc2xvdDogdGhpcy5fZm9ybWF0U2xvdCgndGltZScpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhcnRfYnVja2V0ID0gW107XHJcbiAgICAgICAgZW5kX2J1Y2tldCA9IFtdO1xyXG4gICAgICAgIGNvbW1vbl9idWNrZXQgPSBbXTtcclxuICAgICAgICB0b2dldGhlciA9IHRydWU7XHJcbiAgICAgICAgcHJvY2VzcyA9IGZ1bmN0aW9uKGZvcm1hdCkge1xyXG4gICAgICAgICAgdmFyIGVuZF9zdHIsIHN0YXJ0X2dyb3VwLCBzdGFydF9zdHI7XHJcblxyXG4gICAgICAgICAgc3RhcnRfc3RyID0gZm9ybWF0LmZuKF90aGlzLnN0YXJ0KTtcclxuICAgICAgICAgIGVuZF9zdHIgPSBmb3JtYXQuaWdub3JlRW5kICYmIGZvcm1hdC5pZ25vcmVFbmQoKSA/IHN0YXJ0X3N0ciA6IGZvcm1hdC5mbihfdGhpcy5lbmQpO1xyXG4gICAgICAgICAgc3RhcnRfZ3JvdXAgPSB7XHJcbiAgICAgICAgICAgIGZvcm1hdDogZm9ybWF0LFxyXG4gICAgICAgICAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHN0YXJ0X3N0cjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIGlmIChlbmRfc3RyID09PSBzdGFydF9zdHIgJiYgdG9nZXRoZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbW1vbl9idWNrZXQucHVzaChzdGFydF9ncm91cCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodG9nZXRoZXIpIHtcclxuICAgICAgICAgICAgICB0b2dldGhlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgIGNvbW1vbl9idWNrZXQucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBmb3JtYXQ6IHtcclxuICAgICAgICAgICAgICAgICAgc2xvdDogZm9ybWF0LnNsb3QsXHJcbiAgICAgICAgICAgICAgICAgIHByZTogXCJcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUoZm9sZChzdGFydF9idWNrZXQpLCBmb2xkKGVuZF9idWNrZXQsIHRydWUpLnRyaW0oKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RhcnRfYnVja2V0LnB1c2goc3RhcnRfZ3JvdXApO1xyXG4gICAgICAgICAgICByZXR1cm4gZW5kX2J1Y2tldC5wdXNoKHtcclxuICAgICAgICAgICAgICBmb3JtYXQ6IGZvcm1hdCxcclxuICAgICAgICAgICAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5kX3N0cjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBmcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xyXG4gICAgICAgICAgZm9ybWF0ID0gZnNbX2ldO1xyXG4gICAgICAgICAgcHJvY2Vzcyhmb3JtYXQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnbG9iYWxfZmlyc3QgPSB0cnVlO1xyXG4gICAgICAgIGZvbGQgPSBmdW5jdGlvbihhcnJheSwgc2tpcF9wcmUpIHtcclxuICAgICAgICAgIHZhciBsb2NhbF9maXJzdCwgc2VjdGlvbiwgc3RyLCBfaiwgX2xlbjEsIF9yZWY7XHJcblxyXG4gICAgICAgICAgbG9jYWxfZmlyc3QgPSB0cnVlO1xyXG4gICAgICAgICAgc3RyID0gXCJcIjtcclxuICAgICAgICAgIF9yZWYgPSBhcnJheS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGEuZm9ybWF0LnNsb3QgLSBiLmZvcm1hdC5zbG90O1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xyXG4gICAgICAgICAgICBzZWN0aW9uID0gX3JlZltfal07XHJcbiAgICAgICAgICAgIGlmICghZ2xvYmFsX2ZpcnN0KSB7XHJcbiAgICAgICAgICAgICAgaWYgKGxvY2FsX2ZpcnN0ICYmIHNraXBfcHJlKSB7XHJcbiAgICAgICAgICAgICAgICBzdHIgKz0gXCIgXCI7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHN0ciArPSBzZWN0aW9uLmZvcm1hdC5wcmU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0ciArPSBzZWN0aW9uLnZhbHVlKCk7XHJcbiAgICAgICAgICAgIGdsb2JhbF9maXJzdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBsb2NhbF9maXJzdCA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBmb2xkKGNvbW1vbl9idWNrZXQpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuX3RydWVTdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmFsbERheSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnQuY2xvbmUoKS5zdGFydE9mKFwiZGF5XCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5zdGFydC5jbG9uZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLl90cnVlRW5kID0gZnVuY3Rpb24oZGlmZmFibGVFbmQpIHtcclxuICAgICAgICBpZiAoZGlmZmFibGVFbmQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgZGlmZmFibGVFbmQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRGF5KSB7XHJcbiAgICAgICAgICBpZiAoZGlmZmFibGVFbmQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5kLmNsb25lKCkuYWRkKDEsIFwiZGF5XCIpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5kLmNsb25lKCkuZW5kT2YoXCJkYXlcIik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmVuZC5jbG9uZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLl9pdGVyYXRlSGVscGVyID0gZnVuY3Rpb24ocGVyaW9kLCBpdGVyLCBoYXNOZXh0LCBpbnRlcnZhbEFtb3VudCkge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChpbnRlcnZhbEFtb3VudCA9PSBudWxsKSB7XHJcbiAgICAgICAgICBpbnRlcnZhbEFtb3VudCA9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHZhbDtcclxuXHJcbiAgICAgICAgICAgIGlmICghaGFzTmV4dCgpKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdmFsID0gaXRlci5jbG9uZSgpO1xyXG4gICAgICAgICAgICAgIGl0ZXIuYWRkKGludGVydmFsQW1vdW50LCBwZXJpb2QpO1xyXG4gICAgICAgICAgICAgIHJldHVybiB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBoYXNOZXh0OiBoYXNOZXh0XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLl9wcmVwSXRlcmF0ZUlucHV0cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpbnB1dHMsIGludGVydmFsQW1vdW50LCBtaW5Ib3VycywgcGVyaW9kLCBfcmVmLCBfcmVmMTtcclxuXHJcbiAgICAgICAgaW5wdXRzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcclxuICAgICAgICBpZiAodHlwZW9mIGlucHV0c1swXSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgIHJldHVybiBpbnB1dHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXRzWzBdID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgcGVyaW9kID0gaW5wdXRzLnNoaWZ0KCk7XHJcbiAgICAgICAgICBpbnRlcnZhbEFtb3VudCA9IChfcmVmID0gaW5wdXRzLnBvcCgpKSAhPSBudWxsID8gX3JlZiA6IDE7XHJcbiAgICAgICAgICBpZiAoaW5wdXRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBtaW5Ib3VycyA9IChfcmVmMSA9IGlucHV0c1swXSkgIT0gbnVsbCA/IF9yZWYxIDogZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtb21lbnQuaXNEdXJhdGlvbihpbnB1dHNbMF0pKSB7XHJcbiAgICAgICAgICBwZXJpb2QgPSAnbWlsbGlzZWNvbmRzJztcclxuICAgICAgICAgIGludGVydmFsQW1vdW50ID0gaW5wdXRzWzBdLmFzKHBlcmlvZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbaW50ZXJ2YWxBbW91bnQsIHBlcmlvZCwgbWluSG91cnNdO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuX2lubmVyID0gZnVuY3Rpb24ocGVyaW9kLCBpbnRlcnZhbEFtb3VudCkge1xyXG4gICAgICAgIHZhciBkdXJhdGlvbkNvdW50LCBkdXJhdGlvblBlcmlvZCwgZW5kLCBtb2R1bHVzLCBzdGFydDtcclxuXHJcbiAgICAgICAgaWYgKHBlcmlvZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICBwZXJpb2QgPSBcIm1pbGxpc2Vjb25kc1wiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaW50ZXJ2YWxBbW91bnQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgaW50ZXJ2YWxBbW91bnQgPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGFydCA9IHRoaXMuX3RydWVTdGFydCgpO1xyXG4gICAgICAgIGVuZCA9IHRoaXMuX3RydWVFbmQodHJ1ZSk7XHJcbiAgICAgICAgaWYgKHN0YXJ0ID4gc3RhcnQuY2xvbmUoKS5zdGFydE9mKHBlcmlvZCkpIHtcclxuICAgICAgICAgIHN0YXJ0LnN0YXJ0T2YocGVyaW9kKS5hZGQoaW50ZXJ2YWxBbW91bnQsIHBlcmlvZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChlbmQgPCBlbmQuY2xvbmUoKS5lbmRPZihwZXJpb2QpKSB7XHJcbiAgICAgICAgICBlbmQuc3RhcnRPZihwZXJpb2QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkdXJhdGlvblBlcmlvZCA9IHN0YXJ0LnR3aXgoZW5kKS5hc0R1cmF0aW9uKHBlcmlvZCk7XHJcbiAgICAgICAgZHVyYXRpb25Db3VudCA9IGR1cmF0aW9uUGVyaW9kLmdldChwZXJpb2QpO1xyXG4gICAgICAgIG1vZHVsdXMgPSBkdXJhdGlvbkNvdW50ICUgaW50ZXJ2YWxBbW91bnQ7XHJcbiAgICAgICAgZW5kLnN1YnRyYWN0KG1vZHVsdXMsIHBlcmlvZCk7XHJcbiAgICAgICAgcmV0dXJuIFtzdGFydCwgZW5kXTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLl9sYXp5TGFuZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBlLCBsYW5nRGF0YSwgbGFuZ3VhZ2VzLCBfcmVmO1xyXG5cclxuICAgICAgICBsYW5nRGF0YSA9IHRoaXMuc3RhcnQubGFuZygpO1xyXG4gICAgICAgIGlmICgobGFuZ0RhdGEgIT0gbnVsbCkgJiYgdGhpcy5lbmQubGFuZygpLl9hYmJyICE9PSBsYW5nRGF0YS5fYWJicikge1xyXG4gICAgICAgICAgdGhpcy5lbmQubGFuZyhsYW5nRGF0YS5fYWJicik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgodGhpcy5sYW5nRGF0YSAhPSBudWxsKSAmJiB0aGlzLmxhbmdEYXRhLl9hYmJyID09PSBsYW5nRGF0YS5fYWJicikge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaGFzTW9kdWxlICYmICEobGFuZ3VhZ2VzTG9hZGVkIHx8IGxhbmdEYXRhLl9hYmJyID09PSBcImVuXCIpKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsYW5ndWFnZXMgPSByZXF1aXJlKFwiLi9sYW5nXCIpO1xyXG4gICAgICAgICAgICBsYW5ndWFnZXMobW9tZW50LCBUd2l4KTtcclxuICAgICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xyXG4gICAgICAgICAgICBlID0gX2Vycm9yO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbGFuZ3VhZ2VzTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFuZ0RhdGEgPSAoX3JlZiA9IGxhbmdEYXRhICE9IG51bGwgPyBsYW5nRGF0YS5fdHdpeCA6IHZvaWQgMCkgIT0gbnVsbCA/IF9yZWYgOiBUd2l4LmRlZmF1bHRzO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuX2Zvcm1hdEZuID0gZnVuY3Rpb24obmFtZSwgb3B0aW9ucykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxhbmdEYXRhW25hbWVdLmZuKG9wdGlvbnMpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuX2Zvcm1hdFNsb3QgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFuZ0RhdGFbbmFtZV0uc2xvdDtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLl9mb3JtYXRQcmUgPSBmdW5jdGlvbihuYW1lLCBvcHRpb25zKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxhbmdEYXRhW25hbWVdLnByZSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nRGF0YVtuYW1lXS5wcmUob3B0aW9ucyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmxhbmdEYXRhW25hbWVdLnByZTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5zYW1lRGF5ID0gZGVwcmVjYXRlKFwic2FtZURheVwiLCBcImlzU2FtZSgnZGF5JylcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNTYW1lKFwiZGF5XCIpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLnNhbWVZZWFyID0gZGVwcmVjYXRlKFwic2FtZVllYXJcIiwgXCJpc1NhbWUoJ3llYXInKVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pc1NhbWUoXCJ5ZWFyXCIpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLmNvdW50RGF5cyA9IGRlcHJlY2F0ZShcImNvdW50RGF5c1wiLCBcImNvdW50T3V0ZXIoJ2RheXMnKVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb3VudE91dGVyKFwiZGF5c1wiKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5kYXlzSW4gPSBkZXByZWNhdGUoXCJkYXlzSW5cIiwgXCJpdGVyYXRlKCdkYXlzJyBbLG1pbkhvdXJzXSlcIiwgZnVuY3Rpb24obWluSG91cnMpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pdGVyYXRlKCdkYXlzJywgbWluSG91cnMpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIFR3aXgucHJvdG90eXBlLnBhc3QgPSBkZXByZWNhdGUoXCJwYXN0XCIsIFwiaXNQYXN0KClcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNQYXN0KCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgVHdpeC5wcm90b3R5cGUuZHVyYXRpb24gPSBkZXByZWNhdGUoXCJkdXJhdGlvblwiLCBcImh1bWFuaXplTGVuZ3RoKClcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaHVtYW5pemVMZW5ndGgoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBUd2l4LnByb3RvdHlwZS5tZXJnZSA9IGRlcHJlY2F0ZShcIm1lcmdlXCIsIFwidW5pb24ob3RoZXIpXCIsIGZ1bmN0aW9uKG90aGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudW5pb24ob3RoZXIpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBUd2l4O1xyXG5cclxuICAgIH0pKCk7XHJcbiAgICBnZXRQcm90b3R5cGVPZiA9IGZ1bmN0aW9uKG8pIHtcclxuICAgICAgaWYgKHR5cGVvZiBPYmplY3QuZ2V0UHJvdG90eXBlT2YgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7XHJcbiAgICAgIH0gZWxzZSBpZiAoXCJcIi5fX3Byb3RvX18gPT09IFN0cmluZy5wcm90b3R5cGUpIHtcclxuICAgICAgICByZXR1cm4gby5fX3Byb3RvX187XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG8uY29uc3RydWN0b3IucHJvdG90eXBlO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgVHdpeC5fZXh0ZW5kKGdldFByb3RvdHlwZU9mKG1vbWVudC5mbi5fbGFuZyksIHtcclxuICAgICAgX3R3aXg6IFR3aXguZGVmYXVsdHNcclxuICAgIH0pO1xyXG4gICAgVHdpeC5mb3JtYXRUZW1wbGF0ZSA9IGZ1bmN0aW9uKGxlZnRTaWRlLCByaWdodFNpZGUpIHtcclxuICAgICAgcmV0dXJuIFwiXCIgKyBsZWZ0U2lkZSArIFwiIC0gXCIgKyByaWdodFNpZGU7XHJcbiAgICB9O1xyXG4gICAgbW9tZW50LnR3aXggPSBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIChmdW5jdGlvbihmdW5jLCBhcmdzLCBjdG9yKSB7XHJcbiAgICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcclxuICAgICAgICB2YXIgY2hpbGQgPSBuZXcgY3RvciwgcmVzdWx0ID0gZnVuYy5hcHBseShjaGlsZCwgYXJncyk7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdChyZXN1bHQpID09PSByZXN1bHQgPyByZXN1bHQgOiBjaGlsZDtcclxuICAgICAgfSkoVHdpeCwgYXJndW1lbnRzLCBmdW5jdGlvbigpe30pO1xyXG4gICAgfTtcclxuICAgIG1vbWVudC5mbi50d2l4ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xyXG4gICAgICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XHJcbiAgICAgICAgdmFyIGNoaWxkID0gbmV3IGN0b3IsIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY2hpbGQsIGFyZ3MpO1xyXG4gICAgICAgIHJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XHJcbiAgICAgIH0pKFR3aXgsIFt0aGlzXS5jb25jYXQoX19zbGljZS5jYWxsKGFyZ3VtZW50cykpLCBmdW5jdGlvbigpe30pO1xyXG4gICAgfTtcclxuICAgIG1vbWVudC5mbi5mb3JEdXJhdGlvbiA9IGZ1bmN0aW9uKGR1cmF0aW9uLCBhbGxEYXkpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUd2l4KHRoaXMsIHRoaXMuY2xvbmUoKS5hZGQoZHVyYXRpb24pLCBhbGxEYXkpO1xyXG4gICAgfTtcclxuICAgIG1vbWVudC5kdXJhdGlvbi5mbi5hZnRlck1vbWVudCA9IGZ1bmN0aW9uKHN0YXJ0aW5nVGltZSwgYWxsRGF5KSB7XHJcbiAgICAgIHJldHVybiBuZXcgVHdpeChzdGFydGluZ1RpbWUsIG1vbWVudChzdGFydGluZ1RpbWUpLmNsb25lKCkuYWRkKHRoaXMpLCBhbGxEYXkpO1xyXG4gICAgfTtcclxuICAgIG1vbWVudC5kdXJhdGlvbi5mbi5iZWZvcmVNb21lbnQgPSBmdW5jdGlvbihzdGFydGluZ1RpbWUsIGFsbERheSkge1xyXG4gICAgICByZXR1cm4gbmV3IFR3aXgobW9tZW50KHN0YXJ0aW5nVGltZSkuY2xvbmUoKS5zdWJ0cmFjdCh0aGlzKSwgc3RhcnRpbmdUaW1lLCBhbGxEYXkpO1xyXG4gICAgfTtcclxuICAgIG1vbWVudC50d2l4Q2xhc3MgPSBUd2l4O1xyXG4gICAgcmV0dXJuIFR3aXg7XHJcbiAgfTtcclxuXHJcbiAgaWYgKGhhc01vZHVsZSkge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtYWtlVHdpeChyZXF1aXJlKFwibW9tZW50XCIpKTtcclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgIGRlZmluZShcInR3aXhcIiwgW1wibW9tZW50XCJdLCBmdW5jdGlvbihtb21lbnQpIHtcclxuICAgICAgcmV0dXJuIG1ha2VUd2l4KG1vbWVudCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGlmICh0aGlzLm1vbWVudCAhPSBudWxsKSB7XHJcbiAgICB0aGlzLlR3aXggPSBtYWtlVHdpeCh0aGlzLm1vbWVudCk7XHJcbiAgfVxyXG5cclxufSkuY2FsbCh0aGlzKTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG4gIGdycGggPSB7fTtcclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19jYXRlZ29yaWNhbCgpIHtcclxuXHJcbiAgdmFyIHNjYWxlID0gZ3JwaF9zY2FsZV9jYXRlZ29yaWNhbCgpO1xyXG4gIHZhciB3aWR0aDtcclxuICB2YXIgdmFyaWFibGUsIGhlaWdodDtcclxuXHJcbiAgdmFyIGR1bW15XyA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc19jYXRlZ29yaWNhbCBkdW1teVwiKVxyXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCAwKS5hdHRyKFwiaGVpZ2h0XCIsIDApXHJcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gIHZhciBsYWJlbF9zaXplXyA9IGdycGhfbGFiZWxfc2l6ZShkdW1teV8pO1xyXG5cclxuICBmdW5jdGlvbiBheGlzKGcpIHtcclxuICAgIHZhciB0aWNrcyA9IGF4aXMudGlja3MoKTtcclxuICAgIGcuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgYXhpcy53aWR0aCgpKS5hdHRyKFwiaGVpZ2h0XCIsIGF4aXMuaGVpZ2h0KCkpO1xyXG4gICAgZy5zZWxlY3RBbGwoXCIudGlja1wiKS5kYXRhKHRpY2tzKS5lbnRlcigpXHJcbiAgICAgIC5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tzXCIpXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgYXhpcy53aWR0aCgpIC0gc2V0dGluZ3MoXCJ0aWNrX2xlbmd0aFwiKSlcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBheGlzLndpZHRoKCkpXHJcbiAgICAgIC5hdHRyKFwieTFcIiwgc2NhbGUubSkuYXR0cihcInkyXCIsIHNjYWxlLm0pO1xyXG4gICAgZy5zZWxlY3RBbGwoXCIudGlja2xhYmVsXCIpLmRhdGEodGlja3MpLmVudGVyKClcclxuICAgICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGlja2xhYmVsXCIpXHJcbiAgICAgIC5hdHRyKFwieFwiLCBheGlzLndpZHRoKCkgLSBzZXR0aW5ncyhcInRpY2tfbGVuZ3RoXCIpIC0gc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpXHJcbiAgICAgIC5hdHRyKFwieVwiLCBzY2FsZS5tKVxyXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkO30pXHJcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzVlbVwiKTtcclxuICAgIGcuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzbGluZVwiKVxyXG4gICAgICAuYXR0cihcIngxXCIsIGF4aXMud2lkdGgoKSkuYXR0cihcIngyXCIsIGF4aXMud2lkdGgoKSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCAwKS4gYXR0cihcInkyXCIsIGF4aXMuaGVpZ2h0KCkpO1xyXG4gIH1cclxuXHJcbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHcpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHZhciB0aWNrcyA9IHNjYWxlLnRpY2tzKCk7XHJcbiAgICAgIHZhciBtYXhfd2lkdGggPSAwO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRpY2tzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgdmFyIGx3ID0gbGFiZWxfc2l6ZV8ud2lkdGgodGlja3NbaV0pO1xyXG4gICAgICAgIGlmIChsdyA+IG1heF93aWR0aCkgbWF4X3dpZHRoID0gbHc7XHJcbiAgICAgIH1cclxuICAgICAgd2lkdGggPSBtYXhfd2lkdGggKyBzZXR0aW5ncyhcInRpY2tfbGVuZ3RoXCIpICsgc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIik7ICBcclxuICAgICAgcmV0dXJuIHdpZHRoO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2lkdGggPSB3O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGgpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBoZWlnaHQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoZWlnaHQgPSBoO1xyXG4gICAgICBzY2FsZS5yYW5nZShbMCwgaF0pO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xyXG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSAnc3RyaW5nJyB8fCB2c2NoZW1hLnR5cGUgPT0gJ2NhdGVnb3JpY2FsJyB8fFxyXG4gICAgICB2c2NoZW1hLnR5cGUgPT0gJ3BlcmlvZCc7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB2YXJpYWJsZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhcmlhYmxlID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZS5kb21haW4oKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciBkID0gZGF0YS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV07fSk7XHJcbiAgICAgIC8vIGZpbHRlciBvdXQgZHVwbGljYXRlIHZhbHVlc1xyXG4gICAgICB2YXIgZG9tYWluID0gZC5maWx0ZXIoZnVuY3Rpb24odmFsdWUsIGluZGV4LCBzZWxmKSB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGYuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4O1xyXG4gICAgICB9KTtcclxuICAgICAgc2NhbGUuZG9tYWluKGRvbWFpbik7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIHJldHVybiBzY2FsZSh2W3ZhcmlhYmxlXSkubTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzY2FsZSh2KS5tO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUubCA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcclxuICAgICAgcmV0dXJuIHNjYWxlKHZbdmFyaWFibGVdKS5sO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHNjYWxlKHYpLmw7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZS51ID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxyXG4gICAgICByZXR1cm4gc2NhbGUodlt2YXJpYWJsZV0pLnU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc2NhbGUodikudTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLnNjYWxlLncgPSBmdW5jdGlvbih2KSB7XHJcbiAgICB2YXIgcjtcclxuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcclxuICAgICAgciA9IHNjYWxlKHZbdmFyaWFibGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHIgPSBzY2FsZSh2KTtcclxuICAgIH1cclxuICAgIHJldHVybiByLnUgLSByLmw7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGF4aXM7XHJcbn1cclxuXHJcbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XHJcbmdycGguYXhpcy5jYXRlZ29yaWNhbCA9IGdycGhfYXhpc19jYXRlZ29yaWNhbCgpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19jaGxvcm9wbGV0aCgpIHtcclxuXHJcbiAgdmFyIHZhcmlhYmxlO1xyXG4gIHZhciB3aWR0aCwgaGVpZ2h0O1xyXG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfY2hsb3JvcGxldGgoKTtcclxuXHJcbiAgZnVuY3Rpb24gYXhpcyhnKSB7XHJcbiAgfVxyXG5cclxuICBheGlzLndpZHRoID0gZnVuY3Rpb24odykge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHdpZHRoO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2lkdGggPSB3O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGgpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBoZWlnaHQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoZWlnaHQgPSBoO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xyXG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSAnbnVtYmVyJztcclxuICB9O1xyXG5cclxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHZhcmlhYmxlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyaWFibGUgPSB2O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHZhcmlhYmxlID09PSB1bmRlZmluZWQpIHJldHVybiB0aGlzO1xyXG4gICAgICBzY2FsZS5kb21haW4oZDMuZXh0ZW50KGRhdGEsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbdmFyaWFibGVdO30pKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHNjYWxlLnRpY2tzKCk7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcclxuICAgICAgcmV0dXJuIGF4aXMuc2NhbGUodlt2YXJpYWJsZV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHNjYWxlKHYpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBheGlzO1xyXG59XHJcblxyXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xyXG5ncnBoLmF4aXMuY2hsb3JvcGxldGggPSBncnBoX2F4aXNfY2hsb3JvcGxldGgoKTtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2F4aXNfY29sb3VyKCkge1xyXG5cclxuICB2YXIgc2NhbGUgPSBncnBoX3NjYWxlX2NvbG91cigpO1xyXG4gIHZhciB2YXJpYWJsZV87XHJcbiAgdmFyIHdpZHRoXywgaGVpZ2h0XztcclxuXHJcbiAgZnVuY3Rpb24gYXhpcyhnKSB7XHJcbiAgfVxyXG5cclxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB3aWR0aF87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB3aWR0aF8gPSB3aWR0aDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBoZWlnaHRfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGVpZ2h0XyA9IGhlaWdodDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XHJcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcclxuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gXCJjYXRlZ29yaWNhbFwiIHx8IHZzY2hlbWEudHlwZSA9PSBcInBlcmlvZFwiO1xyXG4gIH07XHJcblxyXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyaWFibGVfID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZS5kb21haW4oKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh2YXJpYWJsZV8gPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XHJcbiAgICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcclxuICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcclxuICAgICAgaWYgKHZzY2hlbWEudHlwZSA9PSBcImNhdGVnb3JpY2FsXCIpIHtcclxuICAgICAgICBjYXRlZ29yaWVzID0gdnNjaGVtYS5jYXRlZ29yaWVzLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWU7IH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciB2YWxzID0gZGF0YS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV9dO30pLnNvcnQoKTtcclxuICAgICAgICB2YXIgcHJldjtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgIGlmICh2YWxzW2ldICE9IHByZXYpIGNhdGVnb3JpZXMucHVzaChcIlwiICsgdmFsc1tpXSk7XHJcbiAgICAgICAgICBwcmV2ID0gdmFsc1tpXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgc2NhbGUuZG9tYWluKGNhdGVnb3JpZXMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gc2NhbGUudGlja3MoKTtcclxuICB9O1xyXG5cclxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxyXG4gICAgICByZXR1cm4gc2NhbGUodlt2YXJpYWJsZV9dKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gYXhpcztcclxufVxyXG5cclxuaWYgKGdycGguYXhpcyA9PT0gdW5kZWZpbmVkKSBncnBoLmF4aXMgPSB7fTtcclxuZ3JwaC5heGlzLmNvbG91ciA9IGdycGhfYXhpc19jb2xvdXIoKTtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2F4aXNfbGluZWFyKGhvcml6b250YWwpIHtcclxuXHJcbiAgdmFyIHNjYWxlXyA9IGdycGhfc2NhbGVfbGluZWFyKCk7XHJcbiAgdmFyIGhvcml6b250YWxfID0gaG9yaXpvbnRhbDtcclxuICB2YXIgdmFyaWFibGVfO1xyXG4gIHZhciB3aWR0aF8sIGhlaWdodF87XHJcbiAgdmFyIG9yaWdpbl87XHJcbiAgdmFyIHNldHRpbmdzXyA9IHtcclxuICAgIFwidGlja19sZW5ndGhcIiA6IDUsXHJcbiAgICBcInRpY2tfcGFkZGluZ1wiIDogMixcclxuICAgIFwicGFkZGluZ1wiIDogNFxyXG4gIH07XHJcblxyXG4gIHZhciBkdW1teV8gPSBkMy5zZWxlY3QoXCJib2R5XCIpLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmVhcmF4aXMgZHVtbXlcIilcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgMCkuYXR0cihcImhlaWdodFwiLCAwKVxyXG4gICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICB2YXIgbGFiZWxfc2l6ZV8gPSBncnBoX2xhYmVsX3NpemUoZHVtbXlfKTtcclxuICBpZiAoaG9yaXpvbnRhbF8pIHNjYWxlXy5sYWJlbF9zaXplKGxhYmVsX3NpemVfLndpZHRoKTtcclxuICBlbHNlIHNjYWxlXy5sYWJlbF9zaXplKGxhYmVsX3NpemVfLmhlaWdodCk7XHJcbiAgXHJcblxyXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xyXG4gICAgdmFyIHcgPSBheGlzLndpZHRoKCk7XHJcbiAgICB2YXIgdGlja3MgPSBheGlzLnRpY2tzKCk7XHJcbiAgICBnLmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIHcpLmF0dHIoXCJoZWlnaHRcIiwgYXhpcy5oZWlnaHQoKSk7XHJcbiAgICBpZiAoaG9yaXpvbnRhbCkge1xyXG4gICAgICBnLnNlbGVjdEFsbChcIi50aWNrXCIpLmRhdGEodGlja3MpLmVudGVyKClcclxuICAgICAgICAuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCBzY2FsZV8pLmF0dHIoXCJ4MlwiLCBzY2FsZV8pXHJcbiAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieTJcIiwgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoKTtcclxuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja2xhYmVsXCIpLmRhdGEodGlja3MpLmVudGVyKClcclxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcclxuICAgICAgICAuYXR0cihcInhcIiwgc2NhbGVfKS5hdHRyKFwieVwiLCBzZXR0aW5nc18udGlja19sZW5ndGggKyBzZXR0aW5nc18udGlja19wYWRkaW5nKVxyXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7fSlcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjAuNzFlbVwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxyXG4gICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tcIilcclxuICAgICAgICAuYXR0cihcIngxXCIsIHctc2V0dGluZ3NfLnRpY2tfbGVuZ3RoKS5hdHRyKFwieDJcIiwgdylcclxuICAgICAgICAuYXR0cihcInkxXCIsIHNjYWxlXykuYXR0cihcInkyXCIsIHNjYWxlXyk7XHJcbiAgICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tsYWJlbFwiKS5kYXRhKHRpY2tzKS5lbnRlcigpXHJcbiAgICAgICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGlja2xhYmVsXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHNldHRpbmdzXy5wYWRkaW5nKS5hdHRyKFwieVwiLCBzY2FsZV8pXHJcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDt9KVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJiZWdpblwiKVxyXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIwLjM1ZW1cIik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcclxuICAgIGlmIChob3Jpem9udGFsXykge1xyXG4gICAgICAvLyBpZiBob3Jpem9udGFsIHRoZSB3aWR0aCBpcyB1c3VhbGx5IGdpdmVuOyB0aGlzIGRlZmluZXMgdGhlIHJhbmdlIG9mXHJcbiAgICAgIC8vIHRoZSBzY2FsZVxyXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiB3aWR0aF87XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgd2lkdGhfID0gd2lkdGg7XHJcbiAgICAgICAgc2NhbGVfLnJhbmdlKFswLCB3aWR0aF9dKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gaWYgdmVydGljYWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZGVmaW5lZCBieSB0aGUgZ3JhcGg6IHRoZSBzcGFjZSBpdFxyXG4gICAgICAvLyBuZWVkcyB0byBkcmF3IHRoZSB0aWNrbWFya3MgYW5kIGxhYmVscyBldGMuIFxyXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHZhciB0aWNrcyA9IHNjYWxlXy50aWNrcygpO1xyXG4gICAgICAgIHZhciB3ID0gMDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRpY2tzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICB2YXIgbHcgPSBsYWJlbF9zaXplXy53aWR0aCh0aWNrc1tpXSk7XHJcbiAgICAgICAgICBpZiAobHcgPiB3KSB3ID0gbHc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdpZHRoXyA9IHcgKyBzZXR0aW5nc18udGlja19sZW5ndGggKyBzZXR0aW5nc18udGlja19wYWRkaW5nICsgc2V0dGluZ3NfLnBhZGRpbmc7ICBcclxuICAgICAgICByZXR1cm4gd2lkdGhfO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHdpZHRoXyA9IHdpZHRoO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcclxuICAgIGlmIChob3Jpem9udGFsXykge1xyXG4gICAgICAvLyBpZiBob3Jpem9udGFsIHRoZSB3aWR0aCBpcyB1c3VhbGx5IGRlZmluZWQgYnkgdGhlIGdyYXBoOiB0aGUgc3BhY2UgaXRcclxuICAgICAgLy8gbmVlZHMgdG8gZHJhdyB0aGUgdGlja21hcmtzIGFuZCBsYWJlbHMgZXRjLiBcclxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICB2YXIgdGlja3MgPSBzY2FsZV8udGlja3MoKTtcclxuICAgICAgICB2YXIgaCA9IDA7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aWNrcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgdmFyIGxoID0gbGFiZWxfc2l6ZV8uaGVpZ2h0KHRpY2tzW2ldKTtcclxuICAgICAgICAgIGlmIChsaCA+IGgpIGggPSBsaDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaGVpZ2h0XyA9IGggKyBzZXR0aW5nc18udGlja19sZW5ndGggKyBzZXR0aW5nc18udGlja19wYWRkaW5nICsgc2V0dGluZ3NfLnBhZGRpbmc7IFxyXG4gICAgICAgIHJldHVybiBoZWlnaHRfO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIGlmIHZlcnRpY2FsIHRoZSB3aWR0aCBpcyB1c3VhbGx5IGdpdmVuOyB0aGlzIGRlZmluZXMgdGhlIHJhbmdlIG9mXHJcbiAgICAgIC8vIHRoZSBzY2FsZVxyXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBoZWlnaHRfO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XHJcbiAgICAgICAgc2NhbGVfLnJhbmdlKFtoZWlnaHRfLCAwXSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xyXG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSAnbnVtYmVyJztcclxuICB9O1xyXG5cclxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHZhcmlhYmxlXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhcmlhYmxlXyA9IHY7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gc2NhbGVfLmRvbWFpbigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyIHJhbmdlID0gZDMuZXh0ZW50KGRhdGEsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICtkW3ZhcmlhYmxlX107fSk7XHJcbiAgICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcclxuICAgICAgaWYgKHZzY2hlbWEub3JpZ2luKSBvcmlnaW5fID0gdnNjaGVtYS5vcmlnaW47XHJcbiAgICAgIGlmIChvcmlnaW5fICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBpZiAocmFuZ2VbMF0gPiBvcmlnaW5fKSByYW5nZVswXSA9IG9yaWdpbl87XHJcbiAgICAgICAgaWYgKHJhbmdlWzFdIDwgb3JpZ2luXykgcmFuZ2VbMV0gPSBvcmlnaW5fO1xyXG4gICAgICB9XHJcbiAgICAgIHNjYWxlXy5kb21haW4ocmFuZ2UpLm5pY2UoKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5vcmlnaW4gPSBmdW5jdGlvbihvcmlnaW4pIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBvcmlnaW5fO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb3JpZ2luXyA9IG9yaWdpbjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHNjYWxlXy50aWNrcygpO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIHJldHVybiBzY2FsZV8odlt2YXJpYWJsZV9dKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzY2FsZV8odik7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGF4aXM7XHJcbn1cclxuXHJcbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XHJcbmdycGguYXhpcy5saW5lYXIgPSBncnBoX2F4aXNfbGluZWFyKCk7XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9heGlzX3BlcmlvZCgpIHtcclxuXHJcbiAgdmFyIHNjYWxlXyA9IGdycGhfc2NhbGVfcGVyaW9kKCk7XHJcbiAgdmFyIGhlaWdodF87XHJcbiAgdmFyIHZhcmlhYmxlXztcclxuICB2YXIgc2V0dGluZ3MgPSB7XHJcbiAgICBcInRpY2tfbGVuZ3RoXCIgOiBbMTUsIDMwLCA0NV1cclxuICB9O1xyXG5cclxuICB2YXIgYXhpcyA9IGZ1bmN0aW9uKGcpIHtcclxuICAgIHZhciB0aWNrcyA9IHNjYWxlXy50aWNrcygpO1xyXG5cclxuICAgIHZhciB0aWNrX2xlbmd0aCA9IHt9O1xyXG4gICAgdmFyIHRpY2sgPSAwO1xyXG4gICAgaWYgKHNjYWxlXy5oYXNfbW9udGgoKSkgdGlja19sZW5ndGgubW9udGggPSBzZXR0aW5ncy50aWNrX2xlbmd0aFt0aWNrKytdO1xyXG4gICAgaWYgKHNjYWxlXy5oYXNfcXVhcnRlcigpKSB0aWNrX2xlbmd0aC5xdWFydGVyID0gc2V0dGluZ3MudGlja19sZW5ndGhbdGljaysrXTtcclxuICAgIHRpY2tfbGVuZ3RoLnllYXIgPSBzZXR0aW5ncy50aWNrX2xlbmd0aFt0aWNrKytdO1xyXG5cclxuICAgIGcuc2VsZWN0QWxsKFwibGluZS50aWNrLWVuZFwiKS5kYXRhKHRpY2tzKS5lbnRlcigpLmFwcGVuZChcImxpbmVcIilcclxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7IFxyXG4gICAgICAgIHZhciBsYXN0ID0gZC5sYXN0ID8gXCIgdGlja2xhc3RcIiA6IFwiXCI7XHJcbiAgICAgICAgcmV0dXJuIFwidGljayB0aWNrZW5kIHRpY2tcIiArIGQudHlwZSArIGxhc3Q7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gc2NhbGVfKGQucGVyaW9kLmVuZCk7fSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCAwKVxyXG4gICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHNjYWxlXyhkLnBlcmlvZC5lbmQpO30pXHJcbiAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gdGlja19sZW5ndGhbZC50eXBlXTt9KTtcclxuICAgIGcuc2VsZWN0QWxsKFwibGluZS50aWNrLXN0YXJ0XCIpLmRhdGEodGlja3MpLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxyXG4gICAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQpIHsgXHJcbiAgICAgICAgdmFyIGxhc3QgPSBkLmxhc3QgPyBcIiB0aWNrbGFzdFwiIDogXCJcIjtcclxuICAgICAgICByZXR1cm4gXCJ0aWNrIHRpY2tzdGFydCB0aWNrXCIgKyBkLnR5cGUgKyBsYXN0O1xyXG4gICAgICB9KVxyXG4gICAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHNjYWxlXyhkLnBlcmlvZC5zdGFydCk7fSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCAwKVxyXG4gICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHNjYWxlXyhkLnBlcmlvZC5zdGFydCk7fSlcclxuICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB0aWNrX2xlbmd0aFtkLnR5cGVdO30pO1xyXG4gICAgZy5zZWxlY3RBbGwoXCJ0ZXh0XCIpLmRhdGEodGlja3MpLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidGlja2xhYmVsIHRpY2tsYWJlbFwiICsgZC50eXBlO30pXHJcbiAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBzY2FsZV8oZC5kYXRlKTt9KVxyXG4gICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gdGlja19sZW5ndGhbZC50eXBlXTt9KVxyXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXHJcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgXHJcbiAgICAgICAgaWYgKGQudHlwZSA9PSBcIm1vbnRoXCIpIHtcclxuICAgICAgICAgIHJldHVybiBkLnBlcmlvZC5zdGFydC5mb3JtYXQoXCJNTU1cIikuY2hhckF0KDApO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZC50eXBlID09IFwicXVhcnRlclwiKSB7XHJcbiAgICAgICAgICByZXR1cm4gXCJRXCIgKyBkLnBlcmlvZC5zdGFydC5mb3JtYXQoXCJRXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZC5sYWJlbDtcclxuICAgICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHRfKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBpZiAoaGVpZ2h0XyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdmFyIHRpY2sgPSAwO1xyXG4gICAgICAgIGlmIChzY2FsZV8uaGFzX21vbnRoKSB0aWNrKys7XHJcbiAgICAgICAgaWYgKHNjYWxlXy5oYXNfcXVhcnRlcikgdGljaysrO1xyXG4gICAgICAgIHJldHVybiBzZXR0aW5ncy50aWNrX2xlbmd0aFt0aWNrXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gaGVpZ2h0XztcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGVpZ2h0XyA9IGhlaWdodDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICB2YXIgciA9IHNjYWxlXy5yYW5nZSgpO1xyXG4gICAgICByZXR1cm4gclsxXSAtIHJbMF07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzY2FsZV8ucmFuZ2UoWzAsIHdpZHRoXSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xyXG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XHJcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdkYXRlJztcclxuICB9O1xyXG5cclxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHZhcmlhYmxlXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhcmlhYmxlXyA9IHY7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gc2NhbGVfLmRvbWFpbigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyIGRvbWFpbiA9IGRhdGEubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbdmFyaWFibGVfXTt9KTtcclxuICAgICAgc2NhbGVfLmRvbWFpbihkb21haW4pO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHRpY2tzID0gc2NhbGVfLnRpY2tzKCk7XHJcbiAgICByZXR1cm4gdGlja3MuZmlsdGVyKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudHlwZSA9PSBcInllYXJcIjt9KTtcclxuICB9O1xyXG5cclxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxyXG4gICAgICBpZiAodi5oYXNPd25Qcm9wZXJ0eShcImRhdGVcIikgJiYgdi5oYXNPd25Qcm9wZXJ0eShcInBlcmlvZFwiKSkge1xyXG4gICAgICAgIHJldHVybiBzY2FsZV8odik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHNjYWxlXyh2W3ZhcmlhYmxlX10pO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc2NhbGVfKHYpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICByZXR1cm4gYXhpcztcclxufVxyXG5cclxuaWYgKGdycGguYXhpcyA9PT0gdW5kZWZpbmVkKSBncnBoLmF4aXMgPSB7fTtcclxuZ3JwaC5heGlzLnBlcmlvZCA9IGdycGhfYXhpc19wZXJpb2QoKTtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2F4aXNfcmVnaW9uKCkge1xyXG5cclxuICB2YXIgdmFyaWFibGVfO1xyXG4gIHZhciB3aWR0aF8sIGhlaWdodF87XHJcbiAgdmFyIG1hcF9sb2FkZWRfO1xyXG4gIHZhciBtYXBfO1xyXG4gIHZhciBpbmRleF8gPSB7fTtcclxuXHJcbiAgZnVuY3Rpb24gYXhpcyhnKSB7XHJcbiAgfVxyXG5cclxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB3aWR0aF87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB1cGRhdGVfcHJvamVjdGlvbl8gPSB1cGRhdGVfcHJvamVjdGlvbl8gfHwgd2lkdGhfICE9IHdpZHRoO1xyXG4gICAgICB3aWR0aF8gPSB3aWR0aDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBoZWlnaHRfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gdXBkYXRlX3Byb2plY3Rpb25fIHx8IGhlaWdodF8gIT0gaGVpZ2h0O1xyXG4gICAgICBoZWlnaHRfID0gaGVpZ2h0O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcclxuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xyXG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSAnc3RyaW5nJztcclxuICB9O1xyXG5cclxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHZhcmlhYmxlXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhcmlhYmxlXyA9IHY7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vIFZhcmlhYmxlIGFuZCBmdW5jdGlvbiB0aGF0IGtlZXBzIHRyYWNrIG9mIHdoZXRoZXIgb3Igbm90IHRoZSBtYXAgaGFzIFxyXG4gIC8vIGZpbmlzaGVkIGxvYWRpbmcuIFRoZSBtZXRob2QgZG9tYWluKCkgbG9hZHMgdGhlIG1hcC4gSG93ZXZlciwgdGhpcyBoYXBwZW5zXHJcbiAgLy8gYXN5bmNocm9ub3VzbHkuIFRoZXJlZm9yZSwgaXQgaXMgcG9zc2libGUgKGFuZCBvZnRlbiBoYXBwZW5zKSB0aGF0IHRoZSBtYXBcclxuICAvLyBoYXMgbm90IHlldCBsb2FkZWQgd2hlbiBzY2FsZSgpIGFuZCB0cmFuc2Zvcm0oKSBhcmUgY2FsbGVkLiBUaGUgY29kZSBcclxuICAvLyBjYWxsaW5nIHRoZXNlIG1ldGhvZHMgdGhlcmVmb3JlIG5lZWRzIHRvIHdhaXQgdW50aWwgdGhlIG1hcCBoYXMgbG9hZGVkLiBcclxuICB2YXIgbWFwX2xvYWRpbmdfID0gZmFsc2U7IFxyXG4gIGF4aXMubWFwX2xvYWRlZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuICFtYXBfbG9hZGluZ187XHJcbiAgfTtcclxuXHJcbiAgZnVuY3Rpb24gbG9hZF9tYXAoZGF0YSwgc2NoZW1hLCBjYWxsYmFjaykge1xyXG4gICAgaWYgKHZhcmlhYmxlXyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gOyAvLyBUT0RPXHJcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XHJcbiAgICBpZiAodnNjaGVtYS5tYXAgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDsgLy8gVE9ET1xyXG4gICAgaWYgKHZzY2hlbWEubWFwID09IG1hcF9sb2FkZWRfKSByZXR1cm47IFxyXG4gICAgbWFwX2xvYWRpbmdfID0gdHJ1ZTtcclxuICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyBpbiBkMy5qc29uXHJcbiAgICBkMy5qc29uKHZzY2hlbWEubWFwLCBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgIG1hcF9sb2FkZWRfID0gdnNjaGVtYS5tYXA7XHJcbiAgICAgIGNhbGxiYWNrKGpzb24pO1xyXG4gICAgICBtYXBfbG9hZGluZ18gPSBmYWxzZTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIC8vcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbG9hZF9tYXAoZGF0YSwgc2NoZW1hLCBmdW5jdGlvbihtYXApIHtcclxuICAgICAgICBtYXBfID0gbWFwO1xyXG4gICAgICAgIHVwZGF0ZV9wcm9qZWN0aW9uXyA9IHRydWU7XHJcbiAgICAgICAgLy8gYnVpbGQgaW5kZXggbWFwcGluZyByZWdpb24gbmFtZSBvbiBmZWF0dXJlcyBcclxuICAgICAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XHJcbiAgICAgICAgdmFyIHJlZ2lvbmlkID0gdnNjaGVtYS5yZWdpb25pZCB8fCBcImlkXCI7XHJcbiAgICAgICAgZm9yICh2YXIgZmVhdHVyZSBpbiBtYXBfLmZlYXR1cmVzKSB7XHJcbiAgICAgICAgICB2YXIgbmFtZSA9IG1hcF8uZmVhdHVyZXNbZmVhdHVyZV0ucHJvcGVydGllc1tyZWdpb25pZF07XHJcbiAgICAgICAgICBpbmRleF9bbmFtZV0gPSBmZWF0dXJlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXHJcbiAgICAgIHJldHVybiBheGlzLnNjYWxlKHZbdmFyaWFibGVfXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBheGlzLnVwZGF0ZV9wcm9qZWN0aW9uKCk7XHJcbiAgICAgIHJldHVybiBwYXRoXyhtYXBfLmZlYXR1cmVzW2luZGV4X1t2XV0pO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vIFRoZSBwcm9qZWN0aW9uLiBDYWxjdWxhdGluZyB0aGUgc2NhbGUgYW5kIHRyYW5zbGF0aW9uIG9mIHRoZSBwcm9qZWN0aW9uIFxyXG4gIC8vIHRha2VzIHRpbWUuIFRoZXJlZm9yZSwgd2Ugb25seSB3YW50IHRvIGRvIHRoYXQgd2hlbiBuZWNlc3NhcnkuIFxyXG4gIC8vIHVwZGF0ZV9wcm9qZWN0aW9uXyBrZWVwcyB0cmFjayBvZiB3aGV0aGVyIG9yIG5vdCB0aGUgcHJvamVjdGlvbiBuZWVkcyBcclxuICAvLyByZWNhbGN1bGF0aW9uXHJcbiAgdmFyIHVwZGF0ZV9wcm9qZWN0aW9uXyA9IHRydWU7XHJcbiAgLy8gdGhlIHByb2plY3Rpb25cclxuICB2YXIgcHJvamVjdGlvbl8gPSBkMy5nZW8udHJhbnN2ZXJzZU1lcmNhdG9yKClcclxuICAgIC5yb3RhdGUoWy01LjM4NzIwNjIxLCAtNTIuMTU1MTc0NDBdKS5zY2FsZSgxKS50cmFuc2xhdGUoWzAsMF0pO1xyXG4gIHZhciBwYXRoXyA9IGQzLmdlby5wYXRoKCkucHJvamVjdGlvbihwcm9qZWN0aW9uXyk7XHJcbiAgLy8gZnVuY3Rpb24gdGhhdCByZWNhbGN1bGF0ZXMgdGhlIHNjYWxlIGFuZCB0cmFuc2xhdGlvbiBvZiB0aGUgcHJvamVjdGlvblxyXG4gIGF4aXMudXBkYXRlX3Byb2plY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgIGlmICh1cGRhdGVfcHJvamVjdGlvbl8gJiYgbWFwXykge1xyXG4gICAgICBwcm9qZWN0aW9uXy5zY2FsZSgxKS50cmFuc2xhdGUoWzAsMF0pO1xyXG4gICAgICBwYXRoXyA9IGQzLmdlby5wYXRoKCkucHJvamVjdGlvbihwcm9qZWN0aW9uXyk7XHJcbiAgICAgIHZhciBib3VuZHMgPSBwYXRoXy5ib3VuZHMobWFwXyk7XHJcbiAgICAgIHZhciBzY2FsZSAgPSAwLjk1IC8gTWF0aC5tYXgoKGJvdW5kc1sxXVswXSAtIGJvdW5kc1swXVswXSkgLyB3aWR0aF8sIFxyXG4gICAgICAgICAgICAgICAgICAoYm91bmRzWzFdWzFdIC0gYm91bmRzWzBdWzFdKSAvIGhlaWdodF8pO1xyXG4gICAgICB2YXIgdHJhbnNsID0gWyh3aWR0aF8gLSBzY2FsZSAqIChib3VuZHNbMV1bMF0gKyBib3VuZHNbMF1bMF0pKSAvIDIsIFxyXG4gICAgICAgICAgICAgICAgICAoaGVpZ2h0XyAtIHNjYWxlICogKGJvdW5kc1sxXVsxXSArIGJvdW5kc1swXVsxXSkpIC8gMl07XHJcbiAgICAgIHByb2plY3Rpb25fLnNjYWxlKHNjYWxlKS50cmFuc2xhdGUodHJhbnNsKTtcclxuICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIHJldHVybiBheGlzO1xyXG59XHJcblxyXG4vLyBBIGZ1bmN0aW9uIGV4cGVjdGluZyB0d28gZnVuY3Rpb25zLiBUaGUgc2Vjb25kIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIHRoZSBcclxuLy8gZmlyc3QgZnVuY3Rpb24gcmV0dXJucyB0cnVlLiBXaGVuIHRoZSBmaXJzdCBmdW5jdGlvbiBkb2VzIG5vdCByZXR1cm4gdHJ1ZVxyXG4vLyB3ZSB3YWl0IGZvciAxMDBtcyBhbmQgdHJ5IGFnYWluLiBcclxudmFyIHdhaXRfZm9yID0gZnVuY3Rpb24obSwgZikge1xyXG4gIGlmIChtKCkpIHtcclxuICAgIGYoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgd2FpdF9mb3IobSwgZik7fSwgMTAwKTtcclxuICB9XHJcbn07XHJcblxyXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xyXG5ncnBoLmF4aXMubGluZWFyID0gZ3JwaF9heGlzX2xpbmVhcigpO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfYXhpc19zaXplKCkge1xyXG5cclxuICB2YXIgdmFyaWFibGVfO1xyXG4gIHZhciB3aWR0aCwgaGVpZ2h0O1xyXG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfc2l6ZSgpO1xyXG5cclxuICBmdW5jdGlvbiBheGlzKGcpIHtcclxuICB9XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gd2lkdGg7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB3aWR0aCA9IHc7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGhlaWdodDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhlaWdodCA9IGg7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xyXG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XHJcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdudW1iZXInO1xyXG4gIH07XHJcblxyXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFyaWFibGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXJpYWJsZSA9IHY7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gc2NhbGUuZG9tYWluKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAodmFyaWFibGUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XHJcbiAgICAgIHNjYWxlLmRvbWFpbihkMy5leHRlbnQoZGF0YSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV07fSkpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gc2NhbGUudGlja3MoKTtcclxuICB9O1xyXG5cclxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xyXG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxyXG4gICAgICByZXR1cm4gYXhpcy5zY2FsZSh2W3ZhcmlhYmxlXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc2NhbGUodik7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGF4aXM7XHJcbn1cclxuXHJcbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XHJcbmdycGguYXhpcy5zaXplID0gZ3JwaF9heGlzX3NpemUoKTtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2F4aXNfc3BsaXQoKSB7XHJcblxyXG4gIHZhciB2YXJpYWJsZV87XHJcbiAgdmFyIHdpZHRoXywgaGVpZ2h0XztcclxuICB2YXIgZG9tYWluXztcclxuICB2YXIgdGlja3NfO1xyXG4gIHZhciBzZXR0aW5nc18gPSB7XHJcbiAgfTtcclxuXHJcbiAgZnVuY3Rpb24gYXhpcyhnKSB7XHJcbiAgfVxyXG5cclxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB3aWR0aF87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB3aWR0aF8gPSB3aWR0aDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBoZWlnaHRfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGVpZ2h0XyA9IGhlaWdodDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XHJcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcclxuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gXCJjYXRlZ29yaWNhbFwiIHx8IHZzY2hlbWEudHlwZSA9PSBcInBlcmlvZFwiO1xyXG4gIH07XHJcblxyXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyaWFibGVfID0gdjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuIFxyXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gZG9tYWluXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh2YXJpYWJsZV8gPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XHJcbiAgICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcclxuICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcclxuICAgICAgaWYgKHZzY2hlbWEudHlwZSA9PSBcImNhdGVnb3JpY2FsXCIpIHtcclxuICAgICAgICBjYXRlZ29yaWVzID0gdnNjaGVtYS5jYXRlZ29yaWVzLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWU7IH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciB2YWxzID0gZGF0YS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV9dO30pLnNvcnQoKTtcclxuICAgICAgICB2YXIgcHJldjtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgIGlmICh2YWxzW2ldICE9IHByZXYpIGNhdGVnb3JpZXMucHVzaChcIlwiICsgdmFsc1tpXSk7XHJcbiAgICAgICAgICBwcmV2ID0gdmFsc1tpXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZG9tYWluXyA9IGNhdGVnb3JpZXM7XHJcbiAgICAgIHZhciBmb3JtYXQgPSB2YXJpYWJsZV92YWx1ZV9mb3JtYXR0ZXIodmFyaWFibGVfLCBzY2hlbWEpO1xyXG4gICAgICB0aWNrc18gPSBkb21haW5fLm1hcChmb3JtYXQpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGlja3NfO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XHJcbiAgICByZXR1cm4gZG9tYWluXy5pbmRleE9mKHYpO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBheGlzO1xyXG59XHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2F4aXNfc3dpdGNoKGF4ZXMpIHtcclxuXHJcbiAgdmFyIHR5cGUgPSAwO1xyXG5cclxuICB2YXIgYXhpcyA9IGZ1bmN0aW9uKGcpIHtcclxuICAgIHJldHVybiBheGVzW3R5cGVdKGcpO1xyXG4gIH07XHJcblxyXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaGVpZ2h0Xykge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGF4ZXNbdHlwZV0uaGVpZ2h0KCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmb3IgKHZhciBpPTA7IGk8YXhlcy5sZW5ndGg7ICsraSkgYXhlc1tpXS5oZWlnaHQoaGVpZ2h0Xyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGF4ZXNbdHlwZV0ud2lkdGgoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZvciAodmFyIGk9MDsgaTxheGVzLmxlbmd0aDsgKytpKSBheGVzW2ldLndpZHRoKHdpZHRoKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XHJcbiAgICBmb3IgKHZhciBpPTA7IGk8YXhlcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICBpZiAoYXhlc1tpXS5hY2NlcHQodmFyaWFibGUsIHNjaGVtYSkpXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfTtcclxuXHJcbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBheGVzW3R5cGVdLnZhcmlhYmxlKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmb3IgKHZhciBpPTA7IGk8YXhlcy5sZW5ndGg7ICsraSkgYXhlc1tpXS52YXJpYWJsZSh2KTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBheGVzW3R5cGVdLnZhcmlhYmxlKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgdmFyaWFibGUgPSBheGlzLnZhcmlhYmxlKCk7XHJcbiAgICAgIGZvciAodmFyIGk9MDsgaTxheGVzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgaWYgKGF4ZXNbaV0uYWNjZXB0KHZhcmlhYmxlLCBzY2hlbWEpKSB7XHJcbiAgICAgICAgICB0eXBlID0gaTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBheGVzW3R5cGVdLmRvbWFpbihkYXRhLCBzY2hlbWEpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGF4ZXNbdHlwZV0udGlja3MoKTtcclxuICB9O1xyXG5cclxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xyXG4gICAgcmV0dXJuIGF4ZXNbdHlwZV0uc2NhbGUodik7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGF4aXM7XHJcbn1cclxuIiwiXHJcbmZ1bmN0aW9uIHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKSB7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2hlbWEuZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAoc2NoZW1hLmZpZWxkc1tpXS5uYW1lID09IHZhcmlhYmxlKSBcclxuICAgICAgcmV0dXJuIHNjaGVtYS5maWVsZHNbaV07XHJcbiAgfVxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZhcmlhYmxlX3ZhbHVlX2Zvcm1hdHRlcih2YXJpYWJsZSwgc2NoZW1hKXtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHNjaGVtYS5maWVsZHMubGVuZ3RoOyBpKyspe1xyXG5cdFx0dmFyIGZpZWxkID0gc2NoZW1hLmZpZWxkc1tpXTtcclxuXHQgICAgaWYgKGZpZWxkLm5hbWUgPT0gdmFyaWFibGUpe1xyXG5cdFx0XHRzd2l0Y2goZmllbGQudHlwZSl7XHJcblx0XHRcdFx0Y2FzZSBcIm51bWJlclwiOntcclxuXHRcdFx0XHRcdHJldHVybiBudW1iZXJfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FzZSBcImNhdGVnb3JpY2FsXCI6e1xyXG5cdFx0XHRcdFx0cmV0dXJuIGNhdGVnb3JpY2FsX2Zvcm1hdHRlcihmaWVsZCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRlZmF1bHQ6e1xyXG5cdFx0XHRcdFx0cmV0dXJuIGRlZmF1bHRfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHQgICAgfVxyXG5cdH1cclxuXHRyZXR1cm4gZGVmYXVsdF9mb3JtYXR0ZXIoKTtcclxufVxyXG4vLyBjcmVhdGVzIGEgZm9ybWF0dGVyIGZvciBwcmV0dHkgcHJpbnRpbmcgdmFsdWVzIGZvciBhIHNwZWNpZmljIGZpZWxkIFxyXG5mdW5jdGlvbiB2YWx1ZV9mb3JtYXR0ZXIoc2NoZW1hKXtcclxuXHR2YXIgZm9ybWF0dGVycyA9IHt9O1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc2NoZW1hLmZpZWxkcy5sZW5ndGg7IGkrKyl7XHJcblx0XHR2YXIgZmllbGQgPSBzY2hlbWEuZmllbGRzW2ldO1xyXG5cdFx0c3dpdGNoKGZpZWxkLnR5cGUpe1xyXG5cdFx0XHRjYXNlIFwibnVtYmVyXCI6e1xyXG5cdFx0XHRcdGZvcm1hdHRlcnNbZmllbGQubmFtZV0gPSBudW1iZXJfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXNlIFwiY2F0ZWdvcmljYWxcIjp7XHJcblx0XHRcdFx0Zm9ybWF0dGVyc1tmaWVsZC5uYW1lXSA9IGNhdGVnb3JpY2FsX2Zvcm1hdHRlcihmaWVsZCk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0ZGVmYXVsdDp7XHJcblx0XHRcdFx0Zm9ybWF0dGVyc1tmaWVsZC5uYW1lXSA9IGRlZmF1bHRfZm9ybWF0dGVyKGZpZWxkKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGZ1bmN0aW9uKGRhdHVtLCBuYW1lKXtcclxuXHRcdHJldHVybiBmb3JtYXR0ZXJzW25hbWVdKGRhdHVtW25hbWVdKTtcclxuXHR9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBkZWZhdWx0X2Zvcm1hdHRlcihmaWVsZCl7XHJcblx0cmV0dXJuIGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRcdHJldHVybiB2YWx1ZTtcclxuXHR9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjYXRlZ29yaWNhbF9mb3JtYXR0ZXIoZmllbGQpe1xyXG5cdHZhciBjYXRfdGl0bGVzID0ge307XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZC5jYXRlZ29yaWVzLmxlbmd0aDsgaSsrKXtcclxuXHRcdHZhciBjYXQgPSBmaWVsZC5jYXRlZ29yaWVzW2ldO1xyXG5cdFx0Y2F0X3RpdGxlc1tjYXQubmFtZV0gPSBjYXQudGl0bGUgfHwgY2F0Lm5hbWU7XHJcblx0fVxyXG5cdHJldHVybiBmdW5jdGlvbih2YWx1ZSl7XHJcblx0XHRyZXR1cm4gY2F0X3RpdGxlc1t2YWx1ZV07XHJcblx0fTtcclxufVxyXG5cclxuZnVuY3Rpb24gbnVtYmVyX2Zvcm1hdHRlcihmaWVsZCl7XHJcblx0Ly9UT0RPIHVzZSByb3VuZGluZz9cclxuXHRyZXR1cm4gZnVuY3Rpb24odmFsdWUpe1xyXG5cdFx0cmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XHJcblx0fTtcclxufVxyXG4iLCJcclxuXHJcbmZ1bmN0aW9uIGRhdGVfcGVyaW9kKHN0cikge1xyXG5cclxuICBmdW5jdGlvbiBpc195ZWFyKHBlcmlvZCkge1xyXG4gICAgLy8gc3RhcnRpbmcgbW9udGggc2hvdWxkIGJlIDBcclxuICAgIGlmIChwZXJpb2Quc3RhcnQubW9udGgoKSAhPT0gMCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgLy8gc3RhcnRpbmcgZGF5IG9mIG1vbnRoIHNob3VsZCBiZSAxXHJcbiAgICBpZiAocGVyaW9kLnN0YXJ0LmRhdGUoKSAhPSAxKSByZXR1cm4gZmFsc2U7XHJcbiAgICAvLyBsZW5ndGggc2hvdWxkIGJlIDEgeWVhclxyXG4gICAgcmV0dXJuIHBlcmlvZC5sZW5ndGgoXCJ5ZWFyc1wiKSA9PSAxO1xyXG4gIH1cclxuICBmdW5jdGlvbiBpc19xdWFydGVyKHBlcmlvZCkge1xyXG4gICAgLy8gc3RhcnRpbmcgbW9udGggc2hvdWxkIGJlIDAsIDMsIDYsIG9yIDlcclxuICAgIGlmICgocGVyaW9kLnN0YXJ0Lm1vbnRoKCkgJSAzKSAhPT0gMCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgLy8gc3RhcnRpbmcgZGF5IG9mIG1vbnRoIHNob3VsZCBiZSAxXHJcbiAgICBpZiAocGVyaW9kLnN0YXJ0LmRhdGUoKSAhPSAxKSByZXR1cm4gZmFsc2U7XHJcbiAgICAvLyBsZW5ndGggc2hvdWxkIGJlIDMgbW9udGhzXHJcbiAgICByZXR1cm4gcGVyaW9kLmxlbmd0aChcIm1vbnRoc1wiKSA9PSAzO1xyXG4gIH1cclxuICBmdW5jdGlvbiBpc19tb250aChwZXJpb2QpIHtcclxuICAgIC8vIHN0YXJ0aW5nIGRheSBvZiBtb250aCBzaG91bGQgYmUgMVxyXG4gICAgaWYgKHBlcmlvZC5zdGFydC5kYXRlKCkgIT0gMSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgLy8gbGVuZ3RoIHNob3VsZCBiZSAxIG1vbnRoc1xyXG4gICAgcmV0dXJuIHBlcmlvZC5sZW5ndGgoXCJtb250aHNcIikgPT0gMTtcclxuICB9XHJcblxyXG4gIHZhciBiYXNpY195ZWFyX3JlZ2V4cCA9IC9eKFxcZHs0fSkkLztcclxuICB2YXIgYmFzaWNfbW9udGhfcmVnZXhwID0gL14oXFxkezR9KVtNbS1dezF9KFxcZHsxLDJ9KSQvO1xyXG4gIHZhciBiYXNpY19xdWFydGVyX3JlZ2V4cCA9IC9eKFxcZHs0fSlbUXFdezF9KFxcZHsxLDJ9KSQvO1xyXG5cclxuICB2YXIgdDAsIGR0LCBwLCB0LCB5ZWFyO1xyXG4gIGlmIChiYXNpY195ZWFyX3JlZ2V4cC50ZXN0KHN0cikpIHtcclxuICAgIHN0ciA9IGJhc2ljX3llYXJfcmVnZXhwLmV4ZWMoc3RyKTtcclxuICAgIHllYXIgPSArc3RyWzFdO1xyXG4gICAgdDAgPSBtb21lbnQoWytzdHJbMV1dKTtcclxuICAgIGR0ID0gbW9tZW50LmR1cmF0aW9uKDEsIFwieWVhclwiKTtcclxuICAgIHAgID0gZHQuYWZ0ZXJNb21lbnQodDApO1xyXG4gICAgdCAgPSB0MC5hZGQobW9tZW50LmR1cmF0aW9uKHAubGVuZ3RoKCkvMikpO1xyXG4gICAgcmV0dXJuIHt0eXBlOiBcInllYXJcIiwgZGF0ZTogdCwgcGVyaW9kOiBwfTtcclxuICB9IGVsc2UgaWYgKGJhc2ljX21vbnRoX3JlZ2V4cC50ZXN0KHN0cikpIHtcclxuICAgIHN0ciA9IGJhc2ljX21vbnRoX3JlZ2V4cC5leGVjKHN0cik7XHJcbiAgICB0MCA9IG1vbWVudChbK3N0clsxXSwgK3N0clsyXS0xXSk7XHJcbiAgICBkdCA9IG1vbWVudC5kdXJhdGlvbigxLCBcIm1vbnRoXCIpO1xyXG4gICAgcCAgPSBkdC5hZnRlck1vbWVudCh0MCk7XHJcbiAgICB0ICA9IHQwLmFkZChtb21lbnQuZHVyYXRpb24ocC5sZW5ndGgoKS8yKSk7XHJcbiAgICByZXR1cm4ge3R5cGU6IFwibW9udGhcIiwgZGF0ZTogdCwgcGVyaW9kOiBwfTtcclxuICB9IGVsc2UgaWYgKGJhc2ljX3F1YXJ0ZXJfcmVnZXhwLnRlc3Qoc3RyKSkge1xyXG4gICAgc3RyID0gYmFzaWNfcXVhcnRlcl9yZWdleHAuZXhlYyhzdHIpO1xyXG4gICAgeWVhciAgICA9ICtzdHJbMV07XHJcbiAgICB2YXIgcXVhcnRlciA9ICtzdHJbMl07XHJcbiAgICB0MCA9IG1vbWVudChbK3N0clsxXSwgKCtzdHJbMl0tMSkqM10pO1xyXG4gICAgZHQgPSBtb21lbnQuZHVyYXRpb24oMywgXCJtb250aFwiKTtcclxuICAgIHAgID0gZHQuYWZ0ZXJNb21lbnQodDApO1xyXG4gICAgdCAgPSB0MC5hZGQobW9tZW50LmR1cmF0aW9uKHAubGVuZ3RoKCkvMikpO1xyXG4gICAgcmV0dXJuIHt0eXBlOiBcInF1YXJ0ZXJcIiwgZGF0ZTogdCwgcGVyaW9kOiBwfTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZihzdHIpID09IFwic3RyaW5nXCIpIHtcclxuICAgIHN0ciA9IHN0ci5zcGxpdChcIi9cIik7XHJcbiAgICB0MCAgID0gbW9tZW50KHN0clswXSwgbW9tZW50LklTT184NjAxKTtcclxuICAgIGlmIChzdHIubGVuZ3RoID09IDEpIHtcclxuICAgICAgZHQgPSBtb21lbnQuZHVyYXRpb24oMCk7XHJcbiAgICAgIHJldHVybiB7dHlwZTogXCJkYXRlXCIsIGRhdGU6IHQwLCBwZXJpb2Q6IGR0LmFmdGVyTW9tZW50KHQwKX07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkdCA9IG1vbWVudC5kdXJhdGlvbihzdHJbMV0pO1xyXG4gICAgICBwICA9IGR0LmFmdGVyTW9tZW50KHQwKTtcclxuICAgICAgdCAgPSB0MC5hZGQobW9tZW50LmR1cmF0aW9uKHAubGVuZ3RoKCkvMikpO1xyXG4gICAgICB2YXIgdHlwZSA9IFwicGVyaW9kXCI7XHJcbiAgICAgIGlmIChpc195ZWFyKHApKSB7IFxyXG4gICAgICAgIHR5cGUgPSBcInllYXJcIjtcclxuICAgICAgfSBlbHNlIGlmIChpc19xdWFydGVyKHApKSB7IFxyXG4gICAgICAgIHR5cGUgPSBcInF1YXJ0ZXJcIjtcclxuICAgICAgfSBlbHNlIGlmIChpc19tb250aChwKSkge1xyXG4gICAgICAgIHR5cGUgPSBcIm1vbnRoXCI7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHt0eXBlOiB0eXBlLCBkYXRlOiB0LCBwZXJpb2Q6IHB9O1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICB0MCAgID0gbW9tZW50KHN0cik7XHJcbiAgICBkdCA9IG1vbWVudC5kdXJhdGlvbigwKTtcclxuICAgIHJldHVybiB7dHlwZTogXCJkYXRlXCIsIGRhdGU6IHQwLCBwZXJpb2Q6IGR0LmFmdGVyTW9tZW50KHQwKX07XHJcbiAgfVxyXG59XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9nZW5lcmljX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCB0eXBlLCBncmFwaF9wYW5lbCkge1xyXG5cclxuICB2YXIgZHVtbXlfID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkdW1teSBncmFwaCBncmFwaC1cIiArIHR5cGUpXHJcbiAgICAuYXR0cihcIndpZHRoXCIsIDApLmF0dHIoXCJoZWlnaHRcIiwgMClcclxuICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgdmFyIGxhYmVsX3NpemVfID0gZ3JwaF9sYWJlbF9zaXplKGR1bW15Xyk7XHJcblxyXG5cclxuICB2YXIgZ3JhcGggPSBncnBoX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBmdW5jdGlvbihnKSB7XHJcbiAgICBmdW5jdGlvbiBuZXN0X2NvbHVtbihkKSB7XHJcbiAgICAgIHJldHVybiBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gZFtheGVzLmNvbHVtbi52YXJpYWJsZSgpXSA6IDE7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBuZXN0X3JvdyhkKSB7XHJcbiAgICAgIHJldHVybiBheGVzLnJvdy52YXJpYWJsZSgpID8gZFtheGVzLnJvdy52YXJpYWJsZSgpXSA6IDE7XHJcbiAgICB9XHJcbiAgICAvLyBzZXR1cCBheGVzXHJcbiAgICBmb3IgKHZhciBheGlzIGluIGF4ZXMpIGF4ZXNbYXhpc10uZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG4gICAgLy8gZGV0ZXJtaW5lIG51bWJlciBvZiByb3dzIGFuZCBjb2x1bW5zXHJcbiAgICB2YXIgbmNvbCA9IGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBheGVzLmNvbHVtbi50aWNrcygpLmxlbmd0aCA6IDE7XHJcbiAgICB2YXIgbnJvdyA9IGF4ZXMucm93LnZhcmlhYmxlKCkgPyBheGVzLnJvdy50aWNrcygpLmxlbmd0aCA6IDE7XHJcbiAgICAvLyBnZXQgbGFiZWxzIGFuZCBkZXRlcm1pbmUgdGhlaXIgaGVpZ2h0XHJcbiAgICB2YXIgdnNjaGVtYXggPSB2YXJpYWJsZV9zY2hlbWEoYXhlcy54LnZhcmlhYmxlKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuICAgIHZhciB4bGFiZWwgPSB2c2NoZW1heC50aXRsZTtcclxuICAgIHZhciBsYWJlbF9oZWlnaHQgPSBsYWJlbF9zaXplXy5oZWlnaHQoeGxhYmVsKSArIHNldHRpbmdzKCdsYWJlbF9wYWRkaW5nJyk7XHJcbiAgICB2YXIgdnNjaGVtYXkgPSB2YXJpYWJsZV9zY2hlbWEoYXhlcy55LnZhcmlhYmxlKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuICAgIHZhciB5bGFiZWwgPSB2c2NoZW1heS50aXRsZTtcclxuICAgIC8vIHNldCB0aGUgd2lkdGgsIGhlaWdodCBlbmQgZG9tYWluIG9mIHRoZSB4LSBhbmQgeS1heGVzLiBXZSBuZWVkIHNvbWUgXHJcbiAgICAvLyBpdGVyYXRpb25zIGZvciB0aGlzLCBhcyB0aGUgaGVpZ2h0IG9mIHRoZSB5LWF4aXMgZGVwZW5kcyBvZiB0aGUgaGVpZ2h0XHJcbiAgICAvLyBvZiB0aGUgeC1heGlzLCB3aGljaCBkZXBlbmRzIG9uIHRoZSBsYWJlbHMgb2YgdGhlIHgtYXhpcywgd2hpY2ggZGVwZW5kc1xyXG4gICAgLy8gb24gdGhlIHdpZHRoIG9mIHRoZSB4LWF4aXMsIGV0Yy4gXHJcbiAgICB2YXIgcm93bGFiZWxfd2lkdGggPSBheGVzLnJvdy52YXJpYWJsZSgpID8gMypsYWJlbF9oZWlnaHQgOiAwO1xyXG4gICAgdmFyIGNvbHVtbmxhYmVsX2hlaWdodCA9IGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyAzKmxhYmVsX2hlaWdodCA6IDA7XHJcbiAgICB2YXIgdywgaDtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgKytpKSB7XHJcbiAgICAgIHcgPSBncmFwaC53aWR0aCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSAtIHNldHRpbmdzKCdwYWRkaW5nJylbM10gLSBcclxuICAgICAgICBheGVzLnkud2lkdGgoKSAtIGxhYmVsX2hlaWdodCAtIHJvd2xhYmVsX3dpZHRoO1xyXG4gICAgICB3ID0gKHcgLSAobmNvbC0xKSpzZXR0aW5ncygnc2VwJykpIC8gbmNvbDtcclxuICAgICAgYXhlcy54LndpZHRoKHcpLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuICAgICAgaCA9IGdyYXBoLmhlaWdodCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVswXSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMl0gLSBcclxuICAgICAgICBheGVzLnguaGVpZ2h0KCkgLSBsYWJlbF9oZWlnaHQgLSBjb2x1bW5sYWJlbF9oZWlnaHQ7XHJcbiAgICAgIGggPSAoaCAtIChucm93LTEpKnNldHRpbmdzKCdzZXAnKSkgLyBucm93O1xyXG4gICAgICBheGVzLnkuaGVpZ2h0KGgpLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuICAgIH1cclxuICAgIHZhciBsID0gYXhlcy55LndpZHRoKCkgKyBzZXR0aW5ncygncGFkZGluZycpWzFdICsgbGFiZWxfaGVpZ2h0O1xyXG4gICAgdmFyIHQgID0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXSArIGNvbHVtbmxhYmVsX2hlaWdodDtcclxuICAgIC8vIGNyZWF0ZSBncm91cCBjb250YWluaW5nIGNvbXBsZXRlIGdyYXBoXHJcbiAgICBnID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImdyYXBoIGdyYXBoLVwiICsgdHlwZSk7XHJcbiAgICAvLyBkcmF3IGxhYmVsc1xyXG4gICAgdmFyIHljZW50ZXIgPSB0ICsgMC41KihncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMF0gLSBzZXR0aW5ncygncGFkZGluZycpWzJdIC0gXHJcbiAgICAgICAgYXhlcy54LmhlaWdodCgpIC0gbGFiZWxfaGVpZ2h0KTtcclxuICAgIHZhciB4Y2VudGVyID0gbCArIDAuNSooZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gXHJcbiAgICAgICAgYXhlcy55LndpZHRoKCkgLSBsYWJlbF9oZWlnaHQpO1xyXG4gICAgZy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsIGxhYmVsLXlcIilcclxuICAgICAgLmF0dHIoXCJ4XCIsIHNldHRpbmdzKCdwYWRkaW5nJylbMV0pLmF0dHIoXCJ5XCIsIHljZW50ZXIpXHJcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dCh5bGFiZWwpXHJcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDkwIFwiICsgc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSArIFwiIFwiICsgeWNlbnRlciArIFwiKVwiKTtcclxuICAgIGcuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJsYWJlbCBsYWJlbC14XCIpXHJcbiAgICAgIC5hdHRyKFwieFwiLCB4Y2VudGVyKS5hdHRyKFwieVwiLCBncmFwaC5oZWlnaHQoKS1zZXR0aW5ncygncGFkZGluZycpWzBdKVxyXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLnRleHQoeGxhYmVsKTtcclxuICAgIGlmIChheGVzLnJvdy52YXJpYWJsZSgpKSB7XHJcbiAgICAgIHZhciB4cm93ID0gZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbM10gLSBsYWJlbF9oZWlnaHQ7XHJcbiAgICAgIHZhciB2c2NoZW1hcm93ID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMucm93LnZhcmlhYmxlKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuICAgICAgdmFyIHJvd2xhYmVsID0gdnNjaGVtYXJvdy50aXRsZTtcclxuICAgICAgZy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsIGxhYmVsLXlcIilcclxuICAgICAgICAuYXR0cihcInhcIiwgeHJvdykuYXR0cihcInlcIiwgeWNlbnRlcilcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLnRleHQocm93bGFiZWwpXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoOTAgXCIgKyB4cm93ICsgXCIgXCIgKyB5Y2VudGVyICsgXCIpXCIpO1xyXG4gICAgfVxyXG4gICAgaWYgKGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkpIHtcclxuICAgICAgdmFyIHZzY2hlbWFjb2x1bW4gPSB2YXJpYWJsZV9zY2hlbWEoYXhlcy5jb2x1bW4udmFyaWFibGUoKSwgZ3JhcGguc2NoZW1hKCkpO1xyXG4gICAgICB2YXIgY29sdW1ubGFiZWwgPSB2c2NoZW1hY29sdW1uLnRpdGxlO1xyXG4gICAgICBnLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwibGFiZWwgbGFiZWwteVwiKVxyXG4gICAgICAgIC5hdHRyKFwieFwiLCB4Y2VudGVyKS5hdHRyKFwieVwiLCBzZXR0aW5ncyhcInBhZGRpbmdcIilbMl0pLmF0dHIoXCJkeVwiLCBcIjAuNzFlbVwiKVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dChjb2x1bW5sYWJlbCk7XHJcbiAgICB9XHJcbiAgICAvLyBjcmVhdGUgZWFjaCBvZiB0aGUgcGFuZWxzXHJcbiAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2x1bW4pLmtleShuZXN0X3JvdykuZW50cmllcyhncmFwaC5kYXRhKCkpO1xyXG4gICAgZm9yIChpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcclxuICAgICAgdmFyIGRqID0gZFtpXS52YWx1ZXM7XHJcbiAgICAgIHQgID0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXSArIGNvbHVtbmxhYmVsX2hlaWdodDtcclxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkai5sZW5ndGg7ICsraikge1xyXG4gICAgICAgIC8vIGRyYXcgeC1heGlzXHJcbiAgICAgICAgaWYgKGogPT0gKGRqLmxlbmd0aC0xKSkge1xyXG4gICAgICAgICAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXMgYXhpcy14XCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbCArIFwiLFwiICsgKHQgKyBoKSArIFwiKVwiKS5jYWxsKGF4ZXMueCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGRyYXcgeS1heGlzXHJcbiAgICAgICAgaWYgKGkgPT09IDApIHtcclxuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzIGF4aXMteVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIChsIC0gYXhlcy55LndpZHRoKCkpICsgXCIsXCIgKyB0ICsgXCIpXCIpXHJcbiAgICAgICAgICAgIC5jYWxsKGF4ZXMueSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGRyYXcgcm93IGxhYmVsc1xyXG4gICAgICAgIGlmIChpID09IChkLmxlbmd0aC0xKSAmJiBheGVzLnJvdy52YXJpYWJsZSgpKSB7XHJcbiAgICAgICAgICB2YXIgcm93dGljayA9IGF4ZXMucm93LnRpY2tzKClbal07XHJcbiAgICAgICAgICB2YXIgZ3JvdyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzIGF4aXMtcm93XCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgKGwgKyB3KSArIFwiLFwiICsgdCArIFwiKVwiKTtcclxuICAgICAgICAgIGdyb3cuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgbGFiZWxfaGVpZ2h0ICsgMipzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKSlcclxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaCk7XHJcbiAgICAgICAgICBncm93LmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGlja2xhYmVsXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCAwKS5hdHRyKFwieVwiLCBoLzIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDkwIFwiICsgXHJcbiAgICAgICAgICAgICAgKGxhYmVsX2hlaWdodCAtIHNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKSArIFwiIFwiICsgaC8yICsgXCIpXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikuYXR0cihcImR5XCIsIFwiMC4zNWVtXCIpXHJcbiAgICAgICAgICAgIC50ZXh0KHJvd3RpY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBkcmF3IGNvbHVtbiBsYWJlbHNcclxuICAgICAgICBpZiAoaiA9PT0gMCAmJiBheGVzLmNvbHVtbi52YXJpYWJsZSgpKSB7XHJcbiAgICAgICAgICB2YXIgY29sdW1udGljayA9IGF4ZXMuY29sdW1uLnRpY2tzKClbaV07XHJcbiAgICAgICAgICB2YXIgY29sdGlja2ggPSBsYWJlbF9oZWlnaHQgKyAyKnNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpO1xyXG4gICAgICAgICAgdmFyIGdjb2x1bW4gPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpcyBheGlzLWNvbHVtblwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGwgKyBcIixcIiArICh0IC0gY29sdGlja2gpICsgXCIpXCIpO1xyXG4gICAgICAgICAgZ2NvbHVtbi5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3KVxyXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBsYWJlbF9oZWlnaHQgKyAyKnNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKTtcclxuICAgICAgICAgIGdjb2x1bW4uYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIHcvMikuYXR0cihcInlcIiwgc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikuYXR0cihcImR5XCIsIFwiMC43MWVtXCIpXHJcbiAgICAgICAgICAgIC50ZXh0KGNvbHVtbnRpY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBkcmF3IGJveCBmb3IgZ3JhcGhcclxuICAgICAgICB2YXIgZ3IgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwicGFuZWxcIilcclxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbCArIFwiLFwiICsgdCArIFwiKVwiKTtcclxuICAgICAgICBnci5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgdykuYXR0cihcImhlaWdodFwiLCBoKTtcclxuICAgICAgICAvLyBkcmF3IGdyaWRcclxuICAgICAgICB2YXIgeHRpY2tzID0gYXhlcy54LnRpY2tzKCk7XHJcbiAgICAgICAgZ3Iuc2VsZWN0QWxsKFwibGluZS5ncmlkeFwiKS5kYXRhKHh0aWNrcykuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXHJcbiAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZ3JpZCBncmlkeFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUpXHJcbiAgICAgICAgICAuYXR0cihcInkxXCIsIDApLmF0dHIoXCJ5MlwiLCBoKTtcclxuICAgICAgICB2YXIgeXRpY2tzID0gYXhlcy55LnRpY2tzKCk7XHJcbiAgICAgICAgZ3Iuc2VsZWN0QWxsKFwibGluZS5ncmlkeVwiKS5kYXRhKHl0aWNrcykuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXHJcbiAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZ3JpZCBncmlkeVwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJ4MVwiLCAwKS5hdHRyKFwieDJcIiwgdylcclxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKTtcclxuICAgICAgICAvLyBhZGQgY3Jvc3NoYWlycyB0byBncmFwaFxyXG4gICAgICAgIHZhciBnY3Jvc3NoID0gZ3IuYXBwZW5kKFwiZ1wiKS5jbGFzc2VkKFwiY3Jvc3NoYWlyc1wiLCB0cnVlKTtcclxuICAgICAgICBnY3Jvc3NoLmFwcGVuZChcImxpbmVcIikuY2xhc3NlZChcImhsaW5lXCIsIHRydWUpLmF0dHIoXCJ4MVwiLCAwKVxyXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieDJcIiwgYXhlcy54LndpZHRoKCkpLmF0dHIoXCJ5MlwiLCAwKVxyXG4gICAgICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICAgICAgICBnY3Jvc3NoLmFwcGVuZChcImxpbmVcIikuY2xhc3NlZChcInZsaW5lXCIsIHRydWUpLmF0dHIoXCJ4MVwiLCAwKVxyXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieDJcIiwgMCkuYXR0cihcInkyXCIsIGF4ZXMueS5oZWlnaHQoKSlcclxuICAgICAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgICAgICAgLy8gZHJhdyBwYW5lbFxyXG4gICAgICAgIGdyYXBoX3BhbmVsKGdyLCBkaltqXS52YWx1ZXMpO1xyXG4gICAgICAgIC8vIG5leHQgcGFuZWxcclxuICAgICAgICB0ICs9IGF4ZXMueS5oZWlnaHQoKSArIHNldHRpbmdzKCdzZXAnKTtcclxuICAgICAgfVxyXG4gICAgICBsICs9IGF4ZXMueC53aWR0aCgpICsgc2V0dGluZ3MoJ3NlcCcpO1xyXG4gICAgfVxyXG4gICAgLy8gZmluaXNoZWQgZHJhd2luZyBjYWxsIHJlYWR5IGV2ZW50XHJcbiAgICBkaXNwYXRjaC5yZWFkeS5jYWxsKGcpO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gZ3JhcGg7XHJcbn1cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIGdyYXBoKSB7XHJcblxyXG4gIHZhciB3aWR0aCwgaGVpZ2h0O1xyXG4gIHZhciBkYXRhLCBzY2hlbWE7XHJcblxyXG4gIGdyYXBoLmF4ZXMgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBkMy5rZXlzKGF4ZXMpO1xyXG4gIH07XHJcblxyXG4gIGdyYXBoLndpZHRoID0gZnVuY3Rpb24odykge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHdpZHRoO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2lkdGggPSB3O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBncmFwaC5oZWlnaHQgPSBmdW5jdGlvbihoKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gaGVpZ2h0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGVpZ2h0ID0gaDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZ3JhcGguYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGVzLCBheGlzKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgaWYgKGF4ZXNbYXhpc10gPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICByZXR1cm4gYXhlc1theGlzXS5hY2NlcHQodmFyaWFibGVzLCBzY2hlbWEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZm9yICh2YXIgaSBpbiBheGVzKSB7XHJcbiAgICAgICAgaWYgKHZhcmlhYmxlc1tpXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBpZiAoYXhlc1tpXS5yZXF1aXJlZCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB2YXIgYWNjZXB0ID0gYXhlc1tpXS5hY2NlcHQodmFyaWFibGVzW2ldLCBzY2hlbWEpO1xyXG4gICAgICAgICAgaWYgKCFhY2NlcHQpIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZ3JhcGguYXNzaWduID0gZnVuY3Rpb24odmFyaWFibGVzKSB7XHJcbiAgICBmb3IgKHZhciBpIGluIGF4ZXMpIGF4ZXNbaV0udmFyaWFibGUodmFyaWFibGVzW2ldKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIGdyYXBoLnNjaGVtYSA9IGZ1bmN0aW9uKHMpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzY2hlbWE7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzY2hlbWEgPSBzO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBncmFwaC5kYXRhID0gZnVuY3Rpb24oZCwgcykge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkYXRhID0gZDtcclxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSBcclxuICAgICAgICBncmFwaC5zY2hlbWEocyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGdyYXBoLmRpc3BhdGNoID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gZGlzcGF0Y2g7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGdyYXBoO1xyXG59XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9ncmFwaF9iYXIoKSB7XHJcblxyXG4gIHZhciBheGVzID0ge1xyXG4gICAgJ3gnIDogZ3JwaF9heGlzX2xpbmVhcih0cnVlKS5vcmlnaW4oMCksXHJcbiAgICAneScgOiBncnBoX2F4aXNfY2F0ZWdvcmljYWwoKSxcclxuICAgICdjb2xvdXInOiBncnBoX2F4aXNfY29sb3VyKCksXHJcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxyXG4gICAgJ3JvdycgOiBncnBoX2F4aXNfc3BsaXQoKVxyXG4gIH07XHJcbiAgYXhlcy54LnJlcXVpcmVkID0gdHJ1ZTtcclxuICBheGVzLnkucmVxdWlyZWQgPSB0cnVlO1xyXG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJjbGlja1wiLCBcInJlYWR5XCIpO1xyXG5cclxuICB2YXIgZ3JhcGggPSBncnBoX2dlbmVyaWNfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIFwiYmFyXCIsIGZ1bmN0aW9uKGcsIGRhdGEpIHtcclxuICAgIGZ1bmN0aW9uIG5lc3RfY29sb3VyKGQpIHtcclxuICAgICAgcmV0dXJuIGF4ZXMuY29sb3VyLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sb3VyLnZhcmlhYmxlKCldIDogMTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGdldF94KGQpIHtcclxuICAgICAgdmFyIHYgPSBheGVzLnguc2NhbGUoZCk7XHJcbiAgICAgIHJldHVybiB2IDwgYXhlcy54LnNjYWxlKG9yaWdpbikgPyB2IDogYXhlcy54LnNjYWxlKG9yaWdpbik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBnZXRfd2lkdGgoZCkge1xyXG4gICAgICByZXR1cm4gTWF0aC5hYnMoYXhlcy54LnNjYWxlKGQpIC0gYXhlcy54LnNjYWxlKG9yaWdpbikpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZ2V0X3koZCkge1xyXG4gICAgICByZXR1cm4gYXhlcy55LnNjYWxlLmwoZCkgKyBpKmF4ZXMueS5zY2FsZS53KGQpL25jb2xvdXJzO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZ2V0X2hlaWdodChkKSB7XHJcbiAgICAgIHJldHVybiBheGVzLnkuc2NhbGUudyhkKS9uY29sb3VycztcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2xvdXIpLmVudHJpZXMoZGF0YSk7XHJcbiAgICB2YXIgbmNvbG91cnMgPSBkLmxlbmd0aDtcclxuICAgIHZhciBvcmlnaW4gPSBheGVzLngub3JpZ2luKCk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcclxuICAgICAgdmFyIGNvbG91ciA9IGF4ZXMuY29sb3VyLnNjYWxlKGRbaV0ua2V5KTtcclxuICAgICAgZy5zZWxlY3RBbGwoXCJyZWN0LlwiICsgY29sb3VyKS5kYXRhKGRbaV0udmFsdWVzKS5lbnRlcigpLmFwcGVuZChcInJlY3RcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFyIFwiICsgY29sb3VyKS5hdHRyKFwieFwiLCBnZXRfeClcclxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIGdldF93aWR0aCkuYXR0cihcInlcIiwgZ2V0X3kpLmF0dHIoXCJoZWlnaHRcIiwgZ2V0X2hlaWdodCk7XHJcbiAgICB9XHJcbiAgICBnLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIFwib3JpZ2luXCIpXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgYXhlcy54LnNjYWxlKG9yaWdpbikpXHJcbiAgICAgIC5hdHRyKFwieDJcIiwgYXhlcy54LnNjYWxlKG9yaWdpbikpXHJcbiAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcInkyXCIsIGF4ZXMueS5oZWlnaHQoKSk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIHdoZW4gZmluaXNoZWQgZHJhd2luZyBncmFwaDsgYWRkIGV2ZW50IGhhbmRsZXJzIFxyXG4gIGRpc3BhdGNoLm9uKFwicmVhZHlcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAvLyBhZGQgaG92ZXIgZXZlbnRzIHRvIHRoZSBsaW5lcyBhbmQgcG9pbnRzXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xyXG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcclxuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xyXG4gICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcclxuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xyXG4gICAgICBkaXNwYXRjaC5jbGljay5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcclxuICBkaXNwYXRjaC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgIGlmICh2YXJpYWJsZSkge1xyXG4gICAgICB2YXIgY2xhc3NlcyA9IGF4ZXMuY29sb3VyLnNjYWxlKFwiXCIgKyB2YWx1ZSk7XHJcbiAgICAgIHZhciByZWdleHAgPSAvXFxiY29sb3VyKFswLTldKylcXGIvO1xyXG4gICAgICB2YXIgY29sb3VyID0gcmVnZXhwLmV4ZWMoY2xhc3NlcylbMF07XHJcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKFwiY29sb3VybG93XCIsIHRydWUpO1xyXG4gICAgICB0aGlzLnNlbGVjdEFsbChcIi5cIiArIGNvbG91cikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IHRydWUsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKGQpKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKGQpKVxyXG4gICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKTtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUoZCkpLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUoZCkpXHJcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xyXG4gIH0pO1xyXG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IGZhbHNlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBUb29sdGlwXHJcbiAgLy8gd2hlbiBkMy50aXAgaXMgbG9hZGVkXHJcbiAgaWYgKGQzLnRpcCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICB2YXIgdGlwID0gZDMudGlwKCkuZGlyZWN0aW9uKFwic2VcIikuYXR0cignY2xhc3MnLCAndGlwIHRpcC1iYXInKS5odG1sKGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkgeyBcclxuICAgICAgdmFyIHNjaGVtYSA9IGdyYXBoLnNjaGVtYSgpO1xyXG4gICAgICB2YXIgZm9ybWF0ID0gdmFsdWVfZm9ybWF0dGVyKHNjaGVtYSk7XHJcbiAgICAgIHZhciBzdHIgPSAnJztcclxuICAgICAgZm9yICh2YXIgaSBpbiBzY2hlbWEuZmllbGRzKSB7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gc2NoZW1hLmZpZWxkc1tpXTtcclxuICAgICAgICBzdHIgKz0gZmllbGQudGl0bGUgKyAnOiAnICsgZm9ybWF0KGQsIGZpZWxkLm5hbWUpICsgJzwvYnI+JztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc3RyO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcInJlYWR5LnRpcFwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jYWxsKHRpcCk7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwibW91c2VvdmVyLnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgICAgdGlwLnNob3codmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJtb3VzZW91dC50aXBcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICAgIHRpcC5oaWRlKHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBncmFwaDtcclxufVxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9ncmFwaF9idWJibGUoKSB7XHJcblxyXG4gIHZhciBheGVzID0ge1xyXG4gICAgJ3gnIDogZ3JwaF9heGlzX2xpbmVhcih0cnVlKSxcclxuICAgICd5JyA6IGdycGhfYXhpc19saW5lYXIoZmFsc2UpLFxyXG4gICAgJ29iamVjdCcgOiBncnBoX2F4aXNfY29sb3VyKCksXHJcbiAgICAnc2l6ZScgICA6IGdycGhfYXhpc19zaXplKCksXHJcbiAgICAnY29sb3VyJyA6IGdycGhfYXhpc19jb2xvdXIoKSxcclxuICAgICdjb2x1bW4nIDogZ3JwaF9heGlzX3NwbGl0KCksXHJcbiAgICAncm93JyA6IGdycGhfYXhpc19zcGxpdCgpXHJcbiAgfTtcclxuICBheGVzLngucmVxdWlyZWQgPSB0cnVlO1xyXG4gIGF4ZXMueS5yZXF1aXJlZCA9IHRydWU7XHJcbiAgYXhlcy5vYmplY3QucmVxdWlyZWQgPSB0cnVlO1xyXG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJjbGlja1wiLCBcInJlYWR5XCIpO1xyXG5cclxuICB2YXIgZ3JhcGggPSBncnBoX2dlbmVyaWNfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIFwiYnViYmxlXCIsIGZ1bmN0aW9uKGcsIGRhdGEpIHtcclxuICAgIGZ1bmN0aW9uIG5lc3Rfb2JqZWN0KGQpIHtcclxuICAgICAgcmV0dXJuIGF4ZXMub2JqZWN0LnZhcmlhYmxlKCkgPyBkW2F4ZXMub2JqZWN0LnZhcmlhYmxlKCldIDogMTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIG5lc3RfY29sb3VyKGQpIHtcclxuICAgICAgcmV0dXJuIGF4ZXMuY29sb3VyLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sb3VyLnZhcmlhYmxlKCldIDogMTtcclxuICAgIH1cclxuICAgIHZhciBkID0gZDMubmVzdCgpLmtleShuZXN0X2NvbG91cikuZW50cmllcyhkYXRhKTtcclxuICAgIC8vIGRyYXcgYnViYmxlcyBcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZC5sZW5ndGg7ICsraSkge1xyXG4gICAgICBnLnNlbGVjdEFsbChcImNpcmNsZS5idWJibGVcIiArIGkpLmRhdGEoZFtpXS52YWx1ZXMpLmVudGVyKCkuYXBwZW5kKFwiY2lyY2xlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJ1YmJsZSBidWJibGVcIiArIGkgKyBcIiBcIiArIGF4ZXMuY29sb3VyLnNjYWxlKGRbaV0ua2V5KSlcclxuICAgICAgICAuYXR0cihcImN4XCIsIGF4ZXMueC5zY2FsZSkuYXR0cihcImN5XCIsIGF4ZXMueS5zY2FsZSlcclxuICAgICAgICAuYXR0cihcInJcIiwgYXhlcy5zaXplLnNjYWxlKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIC8vIHdoZW4gZmluaXNoZWQgZHJhd2luZyBncmFwaDsgYWRkIGV2ZW50IGhhbmRsZXJzIFxyXG4gIGRpc3BhdGNoLm9uKFwicmVhZHlcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAvLyBhZGQgaG92ZXIgZXZlbnRzIHRvIHRoZSBsaW5lcyBhbmQgcG9pbnRzXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xyXG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcclxuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xyXG4gICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcclxuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xyXG4gICAgICBkaXNwYXRjaC5jbGljay5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcclxuICBkaXNwYXRjaC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgIGlmICh2YXJpYWJsZSkge1xyXG4gICAgICB2YXIgY2xhc3NlcyA9IGF4ZXMuY29sb3VyLnNjYWxlKFwiXCIgKyB2YWx1ZSk7XHJcbiAgICAgIHZhciByZWdleHAgPSAvXFxiY29sb3VyKFswLTldKylcXGIvO1xyXG4gICAgICB2YXIgY29sb3VyID0gcmVnZXhwLmV4ZWMoY2xhc3NlcylbMF07XHJcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKFwiY29sb3VybG93XCIsIHRydWUpO1xyXG4gICAgICB0aGlzLnNlbGVjdEFsbChcIi5cIiArIGNvbG91cikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IHRydWUsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKGQpKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKGQpKVxyXG4gICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKTtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUoZCkpLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUoZCkpXHJcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xyXG4gIH0pO1xyXG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IGZhbHNlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBUb29sdGlwXHJcbiAgLy8gd2hlbiBkMy50aXAgaXMgbG9hZGVkXHJcbiAgaWYgKGQzLnRpcCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICB2YXIgdGlwID0gZDMudGlwKCkuZGlyZWN0aW9uKFwic2VcIikuYXR0cignY2xhc3MnLCAndGlwIHRpcC1idWJibGUnKS5odG1sKGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkgeyBcclxuICAgICAgdmFyIHNjaGVtYSA9IGdyYXBoLnNjaGVtYSgpO1xyXG4gICAgICB2YXIgZm9ybWF0ID0gdmFsdWVfZm9ybWF0dGVyKHNjaGVtYSk7XHJcbiAgICAgIHZhciBzdHIgPSAnJztcclxuICAgICAgZm9yICh2YXIgaSBpbiBzY2hlbWEuZmllbGRzKSB7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gc2NoZW1hLmZpZWxkc1tpXTtcclxuICAgICAgICBzdHIgKz0gZmllbGQudGl0bGUgKyAnOiAnICsgZm9ybWF0KGQsIGZpZWxkLm5hbWUpICsgJzwvYnI+JztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc3RyO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcInJlYWR5LnRpcFwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jYWxsKHRpcCk7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwibW91c2VvdmVyLnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgICAgdGlwLnNob3codmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJtb3VzZW91dC50aXBcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICAgIHRpcC5oaWRlKHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG5cclxuICByZXR1cm4gZ3JhcGg7XHJcbn1cclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX2dyYXBoX2xpbmUoKSB7XHJcblxyXG4gIHZhciBheGVzID0ge1xyXG4gICAgJ3gnIDogZ3JwaF9heGlzX3N3aXRjaChbZ3JwaF9heGlzX2xpbmVhcih0cnVlKSwgZ3JwaF9heGlzX3BlcmlvZCgpXSksXHJcbiAgICAneScgOiBncnBoX2F4aXNfbGluZWFyKGZhbHNlKSxcclxuICAgICdjb2xvdXInIDogZ3JwaF9heGlzX2NvbG91cigpLFxyXG4gICAgJ2NvbHVtbicgOiBncnBoX2F4aXNfc3BsaXQoKSxcclxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcclxuICB9O1xyXG4gIGF4ZXMueC5yZXF1aXJlZCA9IHRydWU7XHJcbiAgYXhlcy55LnJlcXVpcmVkID0gdHJ1ZTtcclxuICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaChcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIsIFwicG9pbnRvdmVyXCIsIFwicG9pbnRvdXRcIixcclxuICAgIFwiY2xpY2tcIiwgXCJyZWFkeVwiKTtcclxuXHJcbiAgdmFyIGdyYXBoID0gZ3JwaF9nZW5lcmljX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBcImxpbmVcIiwgZnVuY3Rpb24oZywgZGF0YSkge1xyXG4gICAgZnVuY3Rpb24gbmVzdF9jb2xvdXIoZCkge1xyXG4gICAgICByZXR1cm4gYXhlcy5jb2xvdXIudmFyaWFibGUoKSA/IGRbYXhlcy5jb2xvdXIudmFyaWFibGUoKV0gOiAxO1xyXG4gICAgfVxyXG4gICAgdmFyIGQgPSBkMy5uZXN0KCkua2V5KG5lc3RfY29sb3VyKS5lbnRyaWVzKGRhdGEpO1xyXG4gICAgLy8gZHJhdyBsaW5lcyBcclxuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKS54KGF4ZXMueC5zY2FsZSkueShheGVzLnkuc2NhbGUpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIGcuYXBwZW5kKFwicGF0aFwiKS5hdHRyKFwiZFwiLCBsaW5lKGRbaV0udmFsdWVzKSlcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIGF4ZXMuY29sb3VyLnNjYWxlKGRbaV0ua2V5KSlcclxuICAgICAgICAuZGF0dW0oZFtpXSk7XHJcbiAgICB9XHJcbiAgICAvLyBkcmF3IHBvaW50cyBcclxuICAgIGZvciAoaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIHZhciBjbHMgPSBcImNpcmNsZVwiICsgaTtcclxuICAgICAgZy5zZWxlY3RBbGwoXCJjaXJjbGUuY2lyY2xlXCIgKyBpKS5kYXRhKGRbaV0udmFsdWVzKS5lbnRlcigpLmFwcGVuZChcImNpcmNsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjaXJjbGVcIiArIGkgKyBcIiBcIiArIGF4ZXMuY29sb3VyLnNjYWxlKGRbaV0ua2V5KSlcclxuICAgICAgICAuYXR0cihcImN4XCIsIGF4ZXMueC5zY2FsZSkuYXR0cihcImN5XCIsIGF4ZXMueS5zY2FsZSlcclxuICAgICAgICAuYXR0cihcInJcIiwgc2V0dGluZ3MoJ3BvaW50X3NpemUnKSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIHdoZW4gZmluaXNoZWQgZHJhd2luZyBncmFwaDsgYWRkIGV2ZW50IGhhbmRsZXJzIFxyXG4gIGRpc3BhdGNoLm9uKFwicmVhZHlcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAvLyBhZGQgaG92ZXIgZXZlbnRzIHRvIHRoZSBsaW5lcyBhbmQgcG9pbnRzXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xyXG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICAgIGlmICghZC5rZXkpIGRpc3BhdGNoLnBvaW50b3Zlci5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcclxuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xyXG4gICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICAgIGlmICghZC5rZXkpIGRpc3BhdGNoLnBvaW50b3V0LmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xyXG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIC8vIExvY2FsIGV2ZW50IGhhbmRsZXJzXHJcbiAgLy8gSGlnaGxpZ2h0aW5nIG9mIHNlbGVjdGVkIGxpbmVcclxuICBkaXNwYXRjaC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgIGlmICh2YXJpYWJsZSkge1xyXG4gICAgICB2YXIgY2xhc3NlcyA9IGF4ZXMuY29sb3VyLnNjYWxlKFwiXCIgKyB2YWx1ZSk7XHJcbiAgICAgIHZhciByZWdleHAgPSAvXFxiY29sb3VyKFswLTldKylcXGIvO1xyXG4gICAgICB2YXIgY29sb3VyID0gcmVnZXhwLmV4ZWMoY2xhc3NlcylbMF07XHJcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKFwiY29sb3VybG93XCIsIHRydWUpO1xyXG4gICAgICB0aGlzLnNlbGVjdEFsbChcIi5cIiArIGNvbG91cikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IHRydWUsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogZmFsc2UsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XHJcbiAgfSk7XHJcbiAgLy8gU2hvdyBjcm9zc2hhaXJzIHdoZW4gaG92ZXJpbmcgb3ZlciBhIHBvaW50XHJcbiAgZGlzcGF0Y2gub24oXCJwb2ludG92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKGQpKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKGQpKVxyXG4gICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKTtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUoZCkpLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUoZCkpXHJcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xyXG4gIH0pO1xyXG4gIGRpc3BhdGNoLm9uKFwicG9pbnRvdXRcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFRvb2x0aXBcclxuICAvLyB3aGVuIGQzLnRpcCBpcyBsb2FkZWRcclxuICBpZiAoZDMudGlwICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHZhciB0aXAgPSBkMy50aXAoKS5kaXJlY3Rpb24oXCJzZVwiKS5hdHRyKCdjbGFzcycsICd0aXAgdGlwLWxpbmUnKS5odG1sKGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkgeyBcclxuICAgICAgdmFyIHNjaGVtYSA9IGdyYXBoLnNjaGVtYSgpO1xyXG4gICAgICB2YXIgZm9ybWF0ID0gdmFsdWVfZm9ybWF0dGVyKHNjaGVtYSk7XHJcbiAgICAgIHZhciBzdHIgPSAnJztcclxuICAgICAgZm9yICh2YXIgaSBpbiBzY2hlbWEuZmllbGRzKSB7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gc2NoZW1hLmZpZWxkc1tpXTtcclxuICAgICAgICBzdHIgKz0gZmllbGQudGl0bGUgKyAnOiAnICsgZm9ybWF0KGQsZmllbGQubmFtZSkgKyAnPC9icj4nO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwicmVhZHkudGlwXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNhbGwodGlwKTtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJwb2ludG92ZXIudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgICB0aXAuc2hvdyh2YXJpYWJsZSwgdmFsdWUsIGQpO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcInBvaW50b3V0LnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgICAgdGlwLmhpZGUodmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGdyYXBoO1xyXG59XHJcblxyXG4iLCJcclxuXHJcbmZ1bmN0aW9uIGdycGhfZ3JhcGhfbWFwKCkge1xyXG5cclxuICB2YXIgYXhlcyA9IHtcclxuICAgICdyZWdpb24nIDogZ3JwaF9heGlzX3JlZ2lvbigpLFxyXG4gICAgJ2NvbG91cicgOiBncnBoX2F4aXNfY2hsb3JvcGxldGgoKSxcclxuICAgICdjb2x1bW4nIDogZ3JwaF9heGlzX3NwbGl0KCksXHJcbiAgICAncm93JyA6IGdycGhfYXhpc19zcGxpdCgpXHJcbiAgfTtcclxuICBheGVzLnJlZ2lvbi5yZXF1aXJlZCA9IHRydWU7XHJcbiAgYXhlcy5jb2xvdXIucmVxdWlyZWQgPSB0cnVlO1xyXG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwicmVhZHlcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcImNsaWNrXCIpO1xyXG5cclxuICB2YXIgZHVtbXlfID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkdW1teSBncmFwaCBncmFwaC1tYXBcIilcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgMCkuYXR0cihcImhlaWdodFwiLCAwKVxyXG4gICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICB2YXIgbGFiZWxfc2l6ZV8gPSBncnBoX2xhYmVsX3NpemUoZHVtbXlfKTtcclxuXHJcblxyXG4gIHZhciBncmFwaCA9IGdycGhfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIGZ1bmN0aW9uKGcpIHtcclxuICAgIGZ1bmN0aW9uIG5lc3RfY29sdW1uKGQpIHtcclxuICAgICAgcmV0dXJuIGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sdW1uLnZhcmlhYmxlKCldIDogMTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIG5lc3Rfcm93KGQpIHtcclxuICAgICAgcmV0dXJuIGF4ZXMucm93LnZhcmlhYmxlKCkgPyBkW2F4ZXMucm93LnZhcmlhYmxlKCldIDogMTtcclxuICAgIH1cclxuICAgIC8vIHNldHVwIGF4ZXNcclxuICAgIGF4ZXMucmVnaW9uLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuICAgIGF4ZXMuY29sb3VyLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuICAgIGF4ZXMuY29sdW1uLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuICAgIGF4ZXMucm93LmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcclxuXHJcbiAgICAvLyBkZXRlcm1pbmUgbnVtYmVyIG9mIHJvd3MgYW5kIGNvbHVtbnNcclxuICAgIHZhciBuY29sID0gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGF4ZXMuY29sdW1uLnRpY2tzKCkubGVuZ3RoIDogMTtcclxuICAgIHZhciBucm93ID0gYXhlcy5yb3cudmFyaWFibGUoKSA/IGF4ZXMucm93LnRpY2tzKCkubGVuZ3RoIDogMTtcclxuICAgIC8vIHNldCB0aGUgd2lkdGgsIGhlaWdodCBlbmQgZG9tYWluIG9mIHRoZSB4LSBhbmQgeS1heGVzXHJcbiAgICB2YXIgbGFiZWxfaGVpZ2h0ID0gbGFiZWxfc2l6ZV8uaGVpZ2h0KFwidmFyaWFibGVcIikgKyBzZXR0aW5ncygnbGFiZWxfcGFkZGluZycpO1xyXG4gICAgdmFyIHJvd2xhYmVsX3dpZHRoID0gYXhlcy5yb3cudmFyaWFibGUoKSA/IDMqbGFiZWxfaGVpZ2h0IDogMDtcclxuICAgIHZhciBjb2x1bW5sYWJlbF9oZWlnaHQgPSBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gMypsYWJlbF9oZWlnaHQgOiAwO1xyXG4gICAgdmFyIHcgPSAoZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVsxXSAtIHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVszXSAtIFxyXG4gICAgICByb3dsYWJlbF93aWR0aCAtIChuY29sLTEpKnNldHRpbmdzKFwic2VwXCIsIFwibWFwXCIpKS9uY29sO1xyXG4gICAgdmFyIGggPSAoZ3JhcGguaGVpZ2h0KCkgLSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMF0gLSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMl0gLSBcclxuICAgICAgY29sdW1ubGFiZWxfaGVpZ2h0IC0gKG5yb3ctMSkqc2V0dGluZ3MoXCJzZXBcIiwgXCJtYXBcIikpL25yb3c7XHJcbiAgICB2YXIgbCA9IHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVsxXTtcclxuICAgIHZhciB0ICA9IHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVsyXTtcclxuICAgIGF4ZXMucmVnaW9uLndpZHRoKHcpLmhlaWdodChoKTtcclxuICAgIC8vIGNyZWF0ZSBncm91cCBjb250YWluaW5nIGNvbXBsZXRlIGdyYXBoXHJcbiAgICBnID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImdyYXBoIGdyYXBoLW1hcFwiKTtcclxuICAgIC8vIGRyYXcgbGFiZWxzXHJcbiAgICB2YXIgeWNlbnRlciA9IHQgKyAwLjUqKGdyYXBoLmhlaWdodCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVswXSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMl0gLSBcclxuICAgICAgICBsYWJlbF9oZWlnaHQgLSBjb2x1bW5sYWJlbF9oZWlnaHQpICsgY29sdW1ubGFiZWxfaGVpZ2h0O1xyXG4gICAgdmFyIHhjZW50ZXIgPSBsICsgMC41KihncmFwaC53aWR0aCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSAtIHNldHRpbmdzKCdwYWRkaW5nJylbM10gLSBcclxuICAgICAgICBsYWJlbF9oZWlnaHQgLSByb3dsYWJlbF93aWR0aCk7XHJcbiAgICBpZiAoYXhlcy5yb3cudmFyaWFibGUoKSkge1xyXG4gICAgICB2YXIgeHJvdyA9IGdyYXBoLndpZHRoKCkgLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gbGFiZWxfaGVpZ2h0O1xyXG4gICAgICB2YXIgdnNjaGVtYXJvdyA9IHZhcmlhYmxlX3NjaGVtYShheGVzLnJvdy52YXJpYWJsZSgpLCBzY2hlbWEpO1xyXG4gICAgICB2YXIgcm93bGFiZWwgPSB2c2NoZW1hcm93LnRpdGxlO1xyXG4gICAgICBnLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwibGFiZWwgbGFiZWwteVwiKVxyXG4gICAgICAgIC5hdHRyKFwieFwiLCB4cm93KS5hdHRyKFwieVwiLCB5Y2VudGVyKVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dChyb3dsYWJlbClcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSg5MCBcIiArIHhyb3cgKyBcIiBcIiArIHljZW50ZXIgKyBcIilcIik7XHJcbiAgICB9XHJcbiAgICBpZiAoYXhlcy5jb2x1bW4udmFyaWFibGUoKSkge1xyXG4gICAgICB2YXIgdnNjaGVtYWNvbHVtbiA9IHZhcmlhYmxlX3NjaGVtYShheGVzLmNvbHVtbi52YXJpYWJsZSgpLCBzY2hlbWEpO1xyXG4gICAgICB2YXIgY29sdW1ubGFiZWwgPSB2c2NoZW1hY29sdW1uLnRpdGxlO1xyXG4gICAgICBnLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwibGFiZWwgbGFiZWwteVwiKVxyXG4gICAgICAgIC5hdHRyKFwieFwiLCB4Y2VudGVyKS5hdHRyKFwieVwiLCBzZXR0aW5ncyhcInBhZGRpbmdcIilbMl0pLmF0dHIoXCJkeVwiLCBcIjAuNzFlbVwiKVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dChjb2x1bW5sYWJlbCk7XHJcbiAgICB9XHJcbiAgICAvLyBkcmF3IGdyYXBoc1xyXG4gICAgd2FpdF9mb3IoYXhlcy5yZWdpb24ubWFwX2xvYWRlZCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBkID0gZDMubmVzdCgpLmtleShuZXN0X2NvbHVtbikua2V5KG5lc3Rfcm93KS5lbnRyaWVzKGdyYXBoLmRhdGEoKSk7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZC5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIHZhciBkaiA9IGRbaV0udmFsdWVzO1xyXG4gICAgICAgIHZhciB0ICA9IHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVsyXSArIGNvbHVtbmxhYmVsX2hlaWdodDtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRqLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgICAgICAvLyBkcmF3IHJvdyBsYWJlbHNcclxuICAgICAgICAgIGlmIChpID09IChkLmxlbmd0aC0xKSAmJiBheGVzLnJvdy52YXJpYWJsZSgpKSB7XHJcbiAgICAgICAgICAgIHZhciByb3d0aWNrID0gYXhlcy5yb3cudGlja3MoKVtqXTtcclxuICAgICAgICAgICAgdmFyIGdyb3cgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpcyBheGlzLXJvd1wiKVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgKGwgKyB3KSArIFwiLFwiICsgdCArIFwiKVwiKTtcclxuICAgICAgICAgICAgZ3Jvdy5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIGxhYmVsX2hlaWdodCArIDIqc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaCk7XHJcbiAgICAgICAgICAgIGdyb3cuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcclxuICAgICAgICAgICAgICAuYXR0cihcInhcIiwgMCkuYXR0cihcInlcIiwgaC8yKVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDkwIFwiICsgXHJcbiAgICAgICAgICAgICAgICAobGFiZWxfaGVpZ2h0IC0gc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpICsgXCIgXCIgKyBoLzIgKyBcIilcIilcclxuICAgICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLmF0dHIoXCJkeVwiLCBcIjAuMzVlbVwiKVxyXG4gICAgICAgICAgICAgIC50ZXh0KHJvd3RpY2spO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gZHJhdyBjb2x1bW4gbGFiZWxzXHJcbiAgICAgICAgICBpZiAoaiA9PT0gMCAmJiBheGVzLmNvbHVtbi52YXJpYWJsZSgpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb2x1bW50aWNrID0gYXhlcy5jb2x1bW4udGlja3MoKVtpXTtcclxuICAgICAgICAgICAgdmFyIGNvbHRpY2toID0gbGFiZWxfaGVpZ2h0ICsgMipzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKTtcclxuICAgICAgICAgICAgdmFyIGdjb2x1bW4gPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpcyBheGlzLWNvbHVtblwiKVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbCArIFwiLFwiICsgKHQgLSBjb2x0aWNraCkgKyBcIilcIik7XHJcbiAgICAgICAgICAgIGdjb2x1bW4uYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3KVxyXG4gICAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGxhYmVsX2hlaWdodCArIDIqc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpO1xyXG4gICAgICAgICAgICBnY29sdW1uLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGlja2xhYmVsXCIpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIHcvMikuYXR0cihcInlcIiwgc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpXHJcbiAgICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS5hdHRyKFwiZHlcIiwgXCIwLjcxZW1cIilcclxuICAgICAgICAgICAgICAudGV4dChjb2x1bW50aWNrKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGRyYXcgYm94IGZvciBncmFwaFxyXG4gICAgICAgICAgdmFyIGdyID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcIm1hcFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGwgKyBcIixcIiArIHQgKyBcIilcIik7XHJcbiAgICAgICAgICBnci5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3KS5hdHRyKFwiaGVpZ2h0XCIsIGgpO1xyXG4gICAgICAgICAgLy8gZHJhdyBtYXBcclxuICAgICAgICAgIGdyLnNlbGVjdEFsbChcInBhdGhcIikuZGF0YShkaltqXS52YWx1ZXMpLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImRcIiwgYXhlcy5yZWdpb24uc2NhbGUpLmF0dHIoXCJjbGFzc1wiLCBheGVzLmNvbG91ci5zY2FsZSk7XHJcbiAgICAgICAgICAvLyBuZXh0IGxpbmVcclxuICAgICAgICAgIHQgKz0gaCArIHNldHRpbmdzKFwic2VwXCIsIFwibWFwXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsICs9IHcgKyBzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKTtcclxuICAgICAgfVxyXG4gICAgICAvLyBhZGQgZXZlbnRzIHRvIHRoZSBsaW5lc1xyXG4gICAgICBnLnNlbGVjdEFsbChcInBhdGhcIikub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICAgIHZhciByZWdpb24gPSBkW2F4ZXMucmVnaW9uLnZhcmlhYmxlKCldO1xyXG4gICAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKGcsIGF4ZXMucmVnaW9uLnZhcmlhYmxlKCksIHJlZ2lvbiwgZCk7XHJcbiAgICAgIH0pLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICAgIHZhciByZWdpb24gPSBkW2F4ZXMucmVnaW9uLnZhcmlhYmxlKCldO1xyXG4gICAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwoZywgYXhlcy5yZWdpb24udmFyaWFibGUoKSwgcmVnaW9uLCBkKTtcclxuICAgICAgfSkub24oXCJjbGlja1wiLCBmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgdmFyIHJlZ2lvbiA9IGRbYXhlcy5yZWdpb24udmFyaWFibGUoKV07XHJcbiAgICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbChnLCBheGVzLnJlZ2lvbi52YXJpYWJsZSgpLCByZWdpb24sIGQpO1xyXG4gICAgICB9KTtcclxuICAgICAgLy8gZmluaXNoZWQgZHJhd2luZyBjYWxsIHJlYWR5IGV2ZW50XHJcbiAgICAgIGRpc3BhdGNoLnJlYWR5LmNhbGwoZyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcblxyXG4gIC8vIExvY2FsIGV2ZW50IGhhbmRsZXJzXHJcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXIuZ3JhcGhcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICB0aGlzLnNlbGVjdEFsbChcInBhdGhcIikuY2xhc3NlZChcImNvbG91cmxvd1wiLCB0cnVlKTtcclxuICAgIHRoaXMuc2VsZWN0QWxsKFwicGF0aFwiKS5maWx0ZXIoZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICByZXR1cm4gZFt2YXJpYWJsZV0gPT0gdmFsdWU7XHJcbiAgICB9KS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogdHJ1ZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcclxuICB9KTtcclxuICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0LmdyYXBoXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xyXG4gICAgdGhpcy5zZWxlY3RBbGwoXCJwYXRoXCIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiBmYWxzZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcclxuICB9KTtcclxuICBcclxuICAvLyB0b29sdGlwXHJcbiAgaWYgKGQzLnRpcCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICB2YXIgdGlwID0gZDMudGlwKCkuZGlyZWN0aW9uKFwic2VcIikuYXR0cignY2xhc3MnLCAndGlwIHRpcC1tYXAnKS5odG1sKGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkgeyBcclxuICAgICAgdmFyIHNjaGVtYSA9IGdyYXBoLnNjaGVtYSgpO1xyXG4gICAgICB2YXIgZm9ybWF0ID0gdmFsdWVfZm9ybWF0dGVyKHNjaGVtYSk7XHJcbiAgICAgIHZhciBzdHIgPSAnJztcclxuICAgICAgZm9yICh2YXIgaSBpbiBzY2hlbWEuZmllbGRzKSB7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gc2NoZW1hLmZpZWxkc1tpXTtcclxuICAgICAgICBzdHIgKz0gZmllbGQudGl0bGUgKyAnOiAnICsgZm9ybWF0KGQsIGZpZWxkLm5hbWUpICsgJzwvYnI+JztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc3RyO1xyXG4gICAgfSk7XHJcbiAgICBkaXNwYXRjaC5vbihcInJlYWR5LnRpcFwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jYWxsKHRpcCk7XHJcbiAgICB9KTtcclxuICAgIGRpc3BhdGNoLm9uKFwibW91c2VvdmVyLnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcclxuICAgICAgdGlwLnNob3codmFyaWFibGUsIHZhbHVlLCBkKTtcclxuICAgIH0pO1xyXG4gICAgZGlzcGF0Y2gub24oXCJtb3VzZW91dC50aXBcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XHJcbiAgICAgIHRpcC5oaWRlKHZhcmlhYmxlLCB2YWx1ZSwgZCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBncmFwaDtcclxufVxyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIGdycGhfbGFiZWxfc2l6ZShnKSB7XHJcblxyXG4gIC8vIGEgc3ZnIG9yIGcgZWxlbWVudCB0byB3aGljaCAgd2Ugd2lsbCBiZSBhZGRpbmcgb3VyIGxhYmVsIGluIG9yZGVyIHRvXHJcbiAgLy8gcmVxdWVzdCBpdCdzIHNpemVcclxuICB2YXIgZ18gPSBnO1xyXG4gIC8vIHN0b3JlIHByZXZpb3VzbHkgY2FsY3VsYXRlZCB2YWx1ZXM7IGFzIHRoZSBzaXplIG9mIGNlcnRhaW4gbGFiZWxzIGFyZSBcclxuICAvLyByZXF1ZXN0ZWQgYWdhaW4gYW5kIGFnYWluIHRoaXMgZ3JlYXRseSBlbmhhbmNlcyBwZXJmb3JtYW5jZVxyXG4gIHZhciBzaXplc18gPSB7fTtcclxuXHJcbiAgZnVuY3Rpb24gbGFiZWxfc2l6ZShsYWJlbCkge1xyXG4gICAgaWYgKHNpemVzX1tsYWJlbF0pIHtcclxuICAgICAgcmV0dXJuIHNpemVzX1tsYWJlbF07XHJcbiAgICB9XHJcbiAgICBpZiAoIWdfKSByZXR1cm4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXTtcclxuICAgIHZhciB0ZXh0ID0gZ18uYXBwZW5kKFwidGV4dFwiKS50ZXh0KGxhYmVsKTtcclxuICAgIHZhciBiYm94ID0gdGV4dFswXVswXS5nZXRCQm94KCk7XHJcbiAgICB2YXIgc2l6ZSA9IFtiYm94LndpZHRoKjEuMiwgYmJveC5oZWlnaHQqMC42NV07IC8vIFRPRE8gd2h5OyBhbmQgaXMgdGhpcyBhbHdheXMgY29ycmVjdFxyXG4gICAgLy92YXIgc2l6ZSA9IGhvcml6b250YWxfID8gdGV4dFswXVswXS5nZXRDb21wdXRlZFRleHRMZW5ndGgoKSA6XHJcbiAgICAgIC8vdGV4dFswXVswXS5nZXRCQm94KCkuaGVpZ2h0O1xyXG4gICAgdGV4dC5yZW1vdmUoKTtcclxuICAgIHNpemVzX1tsYWJlbF0gPSBzaXplO1xyXG4gICAgcmV0dXJuIHNpemU7XHJcbiAgfVxyXG5cclxuICBsYWJlbF9zaXplLnN2ZyA9IGZ1bmN0aW9uKGcpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBnXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGdfID0gZztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgbGFiZWxfc2l6ZS53aWR0aCA9IGZ1bmN0aW9uKGxhYmVsKSB7XHJcbiAgICB2YXIgc2l6ZSA9IGxhYmVsX3NpemUobGFiZWwpO1xyXG4gICAgcmV0dXJuIHNpemVbMF07XHJcbiAgfTtcclxuXHJcbiAgbGFiZWxfc2l6ZS5oZWlnaHQgPSBmdW5jdGlvbihsYWJlbCkge1xyXG4gICAgdmFyIHNpemUgPSBsYWJlbF9zaXplKGxhYmVsKTtcclxuICAgIHJldHVybiBzaXplWzFdO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBsYWJlbF9zaXplO1xyXG59XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9zY2FsZV9jYXRlZ29yaWNhbCgpIHtcclxuXHJcbiAgdmFyIGRvbWFpbjtcclxuICB2YXIgcmFuZ2UgPSBbMCwgMV07XHJcblxyXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcclxuICAgIHZhciBpID0gZG9tYWluLmluZGV4T2Yodik7XHJcbiAgICBpZiAoaSA8IDApIHJldHVybiB7bDogdW5kZWZpbmVkLCBtOnVuZGVmaW5lZCwgdTp1bmRlZmluZWR9O1xyXG4gICAgdmFyIGJ3ID0gKHJhbmdlWzFdIC0gcmFuZ2VbMF0pIC8gZG9tYWluLmxlbmd0aDtcclxuICAgIHZhciBtID0gYncqKGkgKyAwLjUpO1xyXG4gICAgdmFyIHcgPSBidyooMSAtIHNldHRpbmdzKFwiYmFyX3BhZGRpbmdcIikpKjAuNTtcclxuICAgIHJldHVybiB7bDptLXcsIG06bSwgdTptK3d9O1xyXG4gIH1cclxuXHJcbiAgc2NhbGUubCA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIHJldHVybiBzY2FsZSh2KS5sO1xyXG4gIH07XHJcblxyXG4gIHNjYWxlLm0gPSBmdW5jdGlvbih2KSB7XHJcbiAgICByZXR1cm4gc2NhbGUodikubTtcclxuICB9O1xyXG5cclxuICBzY2FsZS51ID0gZnVuY3Rpb24odikge1xyXG4gICAgcmV0dXJuIHNjYWxlKHYpLnU7XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIGRvbWFpbjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRvbWFpbiA9IGQ7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHJhbmdlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmFuZ2UgPSByO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGRvbWFpbjtcclxuICB9O1xyXG5cclxuICByZXR1cm4gc2NhbGU7XHJcbn1cclxuXHJcbmlmIChncnBoLnNjYWxlID09PSB1bmRlZmluZWQpIGdycGguc2NhbGUgPSB7fTtcclxuZ3JwaC5zY2FsZS5jYXRlZ29yaWNhbCA9IGdycGhfc2NhbGVfY2F0ZWdvcmljYWw7XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9zY2FsZV9jaGxvcm9wbGV0aCgpIHtcclxuXHJcbiAgdmFyIGRvbWFpbjtcclxuICB2YXIgYmFzZWNsYXNzID0gXCJjaGxvcm9cIjtcclxuICB2YXIgbmNvbG91cnMgID0gOTtcclxuXHJcbiAgZnVuY3Rpb24gc2NhbGUodikge1xyXG4gICAgaWYgKGRvbWFpbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIGFzc3VtZSB3ZSBoYXZlIG9ubHkgMSBjb2xvdXJcclxuICAgICAgcmV0dXJuIGJhc2VjbGFzcyArIFwiIFwiICsgYmFzZWNsYXNzICsgXCJuMVwiICsgXCIgXCIgKyBiYXNlY2xhc3MgKyAxO1xyXG4gICAgfVxyXG4gICAgdmFyIHJhbmdlICA9IGRvbWFpblsxXSAtIGRvbWFpblswXTtcclxuICAgIHZhciB2YWwgICAgPSBNYXRoLnNxcnQoKHYgLSBkb21haW5bMF0pKjAuOTk5OSkgLyBNYXRoLnNxcnQocmFuZ2UpO1xyXG4gICAgdmFyIGNhdCAgICA9IE1hdGguZmxvb3IodmFsKm5jb2xvdXJzKTtcclxuICAgIC8vIHJldHVybnMgc29tZXRoaW5nIGxpa2UgXCJjaGxvcm8gY2hsb3JvbjEwIGNobG9ybzRcIlxyXG4gICAgcmV0dXJuIGJhc2VjbGFzcyArIFwiIFwiICsgYmFzZWNsYXNzICsgXCJuXCIgKyBuY29sb3VycyArIFwiIFwiICsgYmFzZWNsYXNzICsgKGNhdCsxKTtcclxuICB9XHJcblxyXG4gIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKGQpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBkb21haW47XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkb21haW4gPSBkO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHIpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBiYXNlY2xhc3M7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBiYXNlY2xhc3MgPSByO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHN0ZXAgPSAoZG9tYWluWzFdIC0gZG9tYWluWzBdKS9uY29sb3VycztcclxuICAgIHZhciB0ID0gZG9tYWluWzBdO1xyXG4gICAgdmFyIHRpY2tzID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBuY29sb3VyczsgKytpKSB7XHJcbiAgICAgIHRpY2tzLnB1c2godCk7XHJcbiAgICAgIHQgKz0gc3RlcDtcclxuICAgIH1cclxuICAgIHJldHVybiB0aWNrcztcclxuICB9O1xyXG5cclxuICByZXR1cm4gc2NhbGU7XHJcbn1cclxuXHJcbmlmIChncnBoLnNjYWxlID09PSB1bmRlZmluZWQpIGdycGguc2NhbGUgPSB7fTtcclxuZ3JwaC5zY2FsZS5jaGxvcm9wbGV0aCA9IGdycGhfc2NhbGVfY2hsb3JvcGxldGgoKTtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX3NjYWxlX2NvbG91cigpIHtcclxuXHJcbiAgdmFyIGRvbWFpbjtcclxuICB2YXIgcmFuZ2UgPSBcImNvbG91clwiO1xyXG4gIHZhciBuY29sb3VycztcclxuXHJcbiAgZnVuY3Rpb24gc2NhbGUodikge1xyXG4gICAgaWYgKGRvbWFpbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIGFzc3VtZSB3ZSBoYXZlIG9ubHkgMSBjb2xvdXJcclxuICAgICAgcmV0dXJuIHJhbmdlICsgXCIgXCIgKyByYW5nZSArIFwibjFcIiArIFwiIFwiICsgcmFuZ2UgKyAxO1xyXG4gICAgfVxyXG4gICAgdmFyIGkgPSBkb21haW4uaW5kZXhPZih2KTtcclxuICAgIC8vIHJldHVybnMgc29tZXRoaW5nIGxpa2UgXCJjb2xvdXIgY29sb3VybjEwIGNvbG91cjRcIlxyXG4gICAgcmV0dXJuIHJhbmdlICsgXCIgXCIgKyByYW5nZSArIFwiblwiICsgbmNvbG91cnMgKyBcIiBcIiArIHJhbmdlICsgKGkrMSk7XHJcbiAgfVxyXG5cclxuICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbihkKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gZG9tYWluO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZG9tYWluID0gZDtcclxuICAgICAgbmNvbG91cnMgPSBkLmxlbmd0aDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUucmFuZ2UgPSBmdW5jdGlvbihyKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gcmFuZ2U7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByYW5nZSA9IHI7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gZG9tYWluO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBzY2FsZTtcclxufVxyXG5cclxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xyXG5ncnBoLnNjYWxlLmNvbG91ciA9IGdycGhfc2NhbGVfY29sb3VyKCk7XHJcblxyXG4iLCJcclxuZnVuY3Rpb24gZ3JwaF9zY2FsZV9saW5lYXIoKSB7XHJcblxyXG4gIHZhciBsc2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKTtcclxuICB2YXIgbGFiZWxfc2l6ZV8gPSAyMDtcclxuICB2YXIgcGFkZGluZ18gPSA1O1xyXG4gIHZhciBudGlja3NfID0gMTA7XHJcbiAgdmFyIHRpY2tzXztcclxuICB2YXIgbmRlY187XHJcbiAgdmFyIGluc2lkZV8gPSB0cnVlO1xyXG5cclxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XHJcbiAgICByZXR1cm4gbHNjYWxlKHYpO1xyXG4gIH1cclxuXHJcbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xyXG4gICAgZCA9IGxzY2FsZS5kb21haW4oZCk7XHJcbiAgICBuZGVjXyA9IHVuZGVmaW5lZDtcclxuICAgIHRpY2tzXyA9IHVuZGVmaW5lZDtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBkO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUucmFuZ2UgPSBmdW5jdGlvbihyKSB7XHJcbiAgICByID0gbHNjYWxlLnJhbmdlKHIpO1xyXG4gICAgbmRlY18gPSB1bmRlZmluZWQ7XHJcbiAgICB0aWNrc18gPSB1bmRlZmluZWQ7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLmxhYmVsX3NpemUgPSBmdW5jdGlvbihsYWJlbF9zaXplKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gbGFiZWxfc2l6ZV87XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsYWJlbF9zaXplXyA9IGxhYmVsX3NpemU7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGZ1bmN0aW9uIGxzaXplKGxhYmVsKSB7XHJcbiAgICB2YXIgc2l6ZSA9IHR5cGVvZihsYWJlbF9zaXplXykgPT0gXCJmdW5jdGlvblwiID8gbGFiZWxfc2l6ZV8obGFiZWwpIDogbGFiZWxfc2l6ZV87XHJcbiAgICBzaXplICs9IHBhZGRpbmdfO1xyXG4gICAgcmV0dXJuIHNpemU7XHJcbiAgfVxyXG5cclxuICBzY2FsZS5udGlja3MgPSBmdW5jdGlvbihuKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gbnRpY2tzXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG50aWNrc18gPSBuO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS5pbnNpZGUgPSBmdW5jdGlvbihpKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gaW5zaWRlXztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGluc2lkZV8gPSBpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS5uaWNlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgciA9IGxzY2FsZS5yYW5nZSgpO1xyXG4gICAgdmFyIGQgPSBsc2NhbGUuZG9tYWluKCk7XHJcbiAgICB2YXIgbCA9IE1hdGguYWJzKHJbMV0gLSByWzBdKTtcclxuICAgIHZhciB3ID0gd2lsa2luc29uX2lpKGRbMF0sIGRbMV0sIG50aWNrc18sIGxzaXplLCBsKTtcclxuICAgIGlmIChpbnNpZGVfKSB7XHJcbiAgICAgIHZhciB3MSA9IGxzaXplKHcubGFiZWxzWzBdKTtcclxuICAgICAgdmFyIHcyID0gbHNpemUody5sYWJlbHNbdy5sYWJlbHMubGVuZ3RoLTFdKTtcclxuICAgICAgdmFyIHBhZCA9IHcxLzIgKyB3Mi8yO1xyXG4gICAgICB3ID0gd2lsa2luc29uX2lpKGRbMF0sIGRbMV0sIG50aWNrc18sIGxzaXplLCBsLXBhZCk7XHJcbiAgICAgIGlmIChyWzBdIDwgclsxXSkge1xyXG4gICAgICAgIGxzY2FsZS5yYW5nZShbclswXSt3MS8yLCByWzFdLXcyLzJdKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsc2NhbGUucmFuZ2UoW3JbMF0tdzEvMiwgclsxXSt3Mi8yXSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGRvbWFpbiA9IFt3LmxtaW4sIHcubG1heF07XHJcbiAgICBsc2NhbGUuZG9tYWluKFt3LmxtaW4sIHcubG1heF0pO1xyXG4gICAgdGlja3NfID0gdy5sYWJlbHM7XHJcbiAgICBuZGVjXyA9IHcubmRlYztcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIHNjYWxlLnRpY2tzID0gZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAodGlja3NfID09PSB1bmRlZmluZWQpIHJldHVybiBsc2NhbGUudGlja3MobnRpY2tzXyk7XHJcbiAgICByZXR1cm4gdGlja3NfLm1hcChmdW5jdGlvbih0KSB7IHJldHVybiBmb3JtYXRfbnVtYmVyKHQsIFwiXCIsIG5kZWNfKTt9KTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gc2NhbGU7XHJcbn1cclxuXHJcbmlmIChncnBoLnNjYWxlID09PSB1bmRlZmluZWQpIGdycGguc2NhbGUgPSB7fTtcclxuZ3JwaC5zY2FsZS5saW5lYXIgPSBncnBoX3NjYWxlX2xpbmVhcigpO1xyXG5cclxuIiwiZnVuY3Rpb24gZ3JwaF9zY2FsZV9wZXJpb2QoKSB7XHJcblxyXG4gIHZhciB0aW1lX3NjYWxlID0gZDMudGltZS5zY2FsZSgpO1xyXG4gIHZhciB5ZWFyc187XHJcbiAgdmFyIGhhc19tb250aF8gPSBmYWxzZTtcclxuICB2YXIgaGFzX3F1YXJ0ZXJfID0gZmFsc2U7XHJcblxyXG4gIGZ1bmN0aW9uIHNjYWxlKHZhbCkge1xyXG4gICAgaWYgKCh2YWwgaW5zdGFuY2VvZiBEYXRlKSB8fCBtb21lbnQuaXNNb21lbnQodmFsKSkge1xyXG4gICAgICByZXR1cm4gdGltZV9zY2FsZSh2YWwpO1xyXG4gICAgfSBlbHNlIGlmICh2YWwgJiYgdmFsLmRhdGUgJiYgdmFsLnBlcmlvZCkge1xyXG4gICAgICB0aW1lX3NjYWxlKHZhbC5kYXRlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhbCA9IFwiXCIgKyB2YWw7XHJcbiAgICAgIHJldHVybiB0aW1lX3NjYWxlKGRhdGVfcGVyaW9kKHZhbCkuZGF0ZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzY2FsZS5oYXNfbW9udGggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBoYXNfbW9udGhfO1xyXG4gIH07XHJcblxyXG4gIHNjYWxlLmhhc19xdWFydGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gaGFzX3F1YXJ0ZXJfO1xyXG4gIH07XHJcblxyXG4gIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKGRvbWFpbikge1xyXG4gICAgdmFyIHBlcmlvZHMgPSBkb21haW4ubWFwKGRhdGVfcGVyaW9kKTtcclxuICAgIC8vIGRldGVybWluZSB3aGljaCB5ZWFycyBhcmUgaW4gZG9tYWluOyBheGlzIHdpbCBhbHdheXMgZHJhdyBjb21wbGV0ZVxyXG4gICAgLy8geWVhcnNcclxuICAgIHllYXJzXyA9IGQzLmV4dGVudChwZXJpb2RzLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgIHJldHVybiBkLnBlcmlvZC5zdGFydC55ZWFyKCk7XHJcbiAgICB9KTtcclxuICAgIC8vIHNldCBkb21haW5cclxuICAgIHRpbWVfc2NhbGUuZG9tYWluKFtuZXcgRGF0ZSh5ZWFyc19bMF0gKyBcIi0wMS0wMVwiKSwgXHJcbiAgICAgICAgbmV3IERhdGUoKHllYXJzX1sxXSsxKSArIFwiLTAxLTAxXCIpXSk7XHJcbiAgICAvLyBkZXRlcm1pbmUgd2hpY2ggc3VidW5pdHMgb2YgeWVhcnMgc2hvdWxkIGJlIGRyYXduXHJcbiAgICBoYXNfbW9udGhfID0gcGVyaW9kcy5yZWR1Y2UoZnVuY3Rpb24ocCwgZCkge1xyXG4gICAgICByZXR1cm4gcCB8fCBkLnR5cGUgPT0gXCJtb250aFwiO1xyXG4gICAgfSwgZmFsc2UpO1xyXG4gICAgaGFzX3F1YXJ0ZXJfID0gcGVyaW9kcy5yZWR1Y2UoZnVuY3Rpb24ocCwgZCkge1xyXG4gICAgICByZXR1cm4gcCB8fCBkLnR5cGUgPT0gXCJxdWFydGVyXCI7XHJcbiAgICB9LCBmYWxzZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHJhbmdlKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRpbWVfc2NhbGUucmFuZ2UoKTtcclxuICAgIHRpbWVfc2NhbGUucmFuZ2UocmFuZ2UpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciB0aWNrcyA9IFtdO1xyXG4gICAgZm9yICh2YXIgeWVhciA9IHllYXJzX1swXTsgeWVhciA8PSB5ZWFyc19bMV07IHllYXIrKykge1xyXG4gICAgICB2YXIgdGljayA9IGRhdGVfcGVyaW9kKHllYXIgKyBcIi0wMS0wMS9QMVlcIik7XHJcbiAgICAgIHRpY2subGFzdCA9IHllYXIgPT0geWVhcnNfWzFdO1xyXG4gICAgICB0aWNrLmxhYmVsID0geWVhcjtcclxuICAgICAgdGlja3MucHVzaCh0aWNrKTtcclxuXHJcbiAgICAgIGlmIChzY2FsZS5oYXNfcXVhcnRlcigpKSB7XHJcbiAgICAgICAgZm9yICh2YXIgcSA9IDA7IHEgPCA0OyBxKyspIHtcclxuICAgICAgICAgIHRpY2sgPSBkYXRlX3BlcmlvZCh5ZWFyICsgXCItXCIgKyB6ZXJvUGFkKHEqMysxLCAyKSArIFwiLTAxL1AzTVwiKTtcclxuICAgICAgICAgIHRpY2subGFzdCA9IHEgPT0gMztcclxuICAgICAgICAgIHRpY2subGFiZWwgPSBxKzE7XHJcbiAgICAgICAgICB0aWNrcy5wdXNoKHRpY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBcclxuICAgICAgaWYgKHNjYWxlLmhhc19tb250aCgpKSB7XHJcbiAgICAgICAgZm9yICh2YXIgbSA9IDA7IG0gPCAxMjsgbSsrKSB7XHJcbiAgICAgICAgICB0aWNrID0gZGF0ZV9wZXJpb2QoeWVhciArIFwiLVwiICsgemVyb1BhZChtKzEsMikgKyBcIi0wMS9QMU1cIik7XHJcbiAgICAgICAgICB0aWNrLmxhc3QgPSAoc2NhbGUuaGFzX3F1YXJ0ZXIoKSAmJiAoKG0rMSkgJSAzKSA9PT0gMCkgfHwgbSA9PSAxMTtcclxuICAgICAgICAgIHRpY2subGFiZWwgPSBtKzE7XHJcbiAgICAgICAgICB0aWNrcy5wdXNoKHRpY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBcclxuICAgIH1cclxuICAgIHJldHVybiB0aWNrcztcclxuICB9O1xyXG5cclxuICByZXR1cm4gc2NhbGU7XHJcbn1cclxuXHJcblxyXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XHJcbmdycGguc2NhbGUucGVyaW9kID0gZ3JwaF9zY2FsZV9wZXJpb2QoKTtcclxuXHJcbiIsIlxyXG5mdW5jdGlvbiBncnBoX3NjYWxlX3NpemUoKSB7XHJcbiAgXHJcbiAgdmFyIG1heDtcclxuICB2YXIgZG9tYWluO1xyXG5cclxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XHJcbiAgICBpZiAoZG9tYWluID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHNldHRpbmdzKFwiZGVmYXVsdF9idWJibGVcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgbSA9IG1heCA9PT0gdW5kZWZpbmVkID8gc2V0dGluZ3MoXCJtYXhfYnViYmxlXCIpIDogbWF4O1xyXG4gICAgICByZXR1cm4gbSAqIE1hdGguc3FydCh2KS9NYXRoLnNxcnQoZG9tYWluWzFdKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKGQpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBkb21haW47XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkb21haW4gPSBkMy5leHRlbnQoZCk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIG1heCA9PT0gdW5kZWZpbmVkID8gc2V0dGluZ3MoXCJtYXhfYnViYmxlXCIpIDogbWF4O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWF4ID0gZDMubWF4KHIpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9O1xyXG5cclxuICByZXR1cm4gc2NhbGU7XHJcbn1cclxuXHJcbmlmIChncnBoLnNjYWxlID09PSB1bmRlZmluZWQpIGdycGguc2NhbGUgPSB7fTtcclxuZ3JwaC5zY2FsZS5zaXplID0gZ3JwaF9zY2FsZV9zaXplKCk7XHJcblxyXG4iLCJcclxuXHJcbnZhciBzZXR0aW5ncyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzID0ge1xyXG4gICAgJ2RlZmF1bHQnIDoge1xyXG4gICAgICAncGFkZGluZycgOiBbMiwgMiwgMiwgMl0sXHJcbiAgICAgICdsYWJlbF9wYWRkaW5nJyA6IDQsXHJcbiAgICAgICdzZXAnIDogOCxcclxuICAgICAgJ3BvaW50X3NpemUnIDogNCxcclxuICAgICAgJ21heF9idWJibGUnIDogMjAsXHJcbiAgICAgICdkZWZhdWx0X2J1YmJsZScgOiA1LFxyXG4gICAgICAnYmFyX3BhZGRpbmcnIDogMC40LFxyXG4gICAgICAndGlja19sZW5ndGgnIDogNSxcclxuICAgICAgJ3RpY2tfcGFkZGluZycgOiAyXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZnVuY3Rpb24gZ2V0KHNldHRpbmcsIHR5cGUpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBzZXR0aW5ncztcclxuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICBpZiAoc1t0eXBlXSAhPT0gdW5kZWZpbmVkICYmIHNbdHlwZV1bc2V0dGluZ10gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBzW3R5cGVdW3NldHRpbmddO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBzLmRlZmF1bHRbc2V0dGluZ107XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzLmRlZmF1bHRbc2V0dGluZ107XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXQuc2V0ID0gZnVuY3Rpb24oc2V0dGluZywgYSwgYikge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgcy5kZWZhdWx0W3NldHRpbmddID0gYTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgaWYgKHNbYV0gPT09IHVuZGVmaW5lZCkgc1thXSA9IHt9O1xyXG4gICAgICBzW2FdW3NldHRpbmddID0gYjtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZWVkIGF0IGxlYXQgdHdvIGFyZ3VtZW50cy5cIik7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGdldDtcclxufSgpO1xyXG5cclxuZ3JwaC5zZXR0aW5ncyA9IHNldHRpbmdzO1xyXG4iLCJcclxuLy8gQ29udmVydCBhIG51bWJlciB0byBzdHJpbmcgcGFkZGluZyBpdCB3aXRoIHplcm9zIHVudGlsIHRoZSBudW1iZXIgb2YgXHJcbi8vIGNoYXJhY3RlcnMgYmVmb3JlIHRoZSBkZWNpbWFsIHN5bWJvbCBlcXVhbHMgbGVuZ3RoIChub3QgaW5jbHVkaW5nIHNpZ24pXHJcbmZ1bmN0aW9uIHplcm9fcGFkKG51bSwgbGVuZ3RoKSB7XHJcbiAgdmFyIG4gPSBNYXRoLmFicyhudW0pO1xyXG4gIHZhciBuemVyb3MgPSBNYXRoLm1heCgwLCBsZW5ndGggLSBNYXRoLmZsb29yKG4pLnRvU3RyaW5nKCkubGVuZ3RoICk7XHJcbiAgdmFyIHBhZGRpbmcgPSBNYXRoLnBvdygxMCwgbnplcm9zKS50b1N0cmluZygpLnN1YnN0cigxKTtcclxuICBpZiggbnVtIDwgMCApIHtcclxuICAgIHBhZGRpbmcgPSAnLScgKyBwYWRkaW5nO1xyXG4gIH1cclxuICByZXR1cm4gcGFkZGluZyArIG47XHJcbn1cclxuXHJcblxyXG4vLyBGb3JtYXQgYSBudW1lcmljIHZhbHVlOlxyXG4vLyAtIE1ha2Ugc3VyZSBpdCBpcyByb3VuZGVkIHRvIHRoZSBjb3JyZWN0IG51bWJlciBvZiBkZWNpbWFscyAobmRlYylcclxuLy8gLSBVc2UgdGhlIGNvcnJlY3QgZGVjaW1hbCBzZXBhcmF0b3IgKGRlYylcclxuLy8gLSBBZGQgYSB0aG91c2FuZHMgc2VwYXJhdG9yIChncnApXHJcbmZ1bmN0aW9uIGZvcm1hdF9udW1iZXIobGFiZWwsIHVuaXQsIG5kZWMsIGRlYywgZ3JwKSB7XHJcbiAgaWYgKGlzTmFOKGxhYmVsKSkgcmV0dXJuICcnO1xyXG4gIGlmICh1bml0ID09PSB1bmRlZmluZWQpIHVuaXQgPSAnJztcclxuICBpZiAoZGVjID09PSB1bmRlZmluZWQpIGRlYyA9ICcuJztcclxuICBpZiAoZ3JwID09PSB1bmRlZmluZWQpIGdycCA9ICcnO1xyXG4gIC8vIHJvdW5kIG51bWJlclxyXG4gIGlmIChuZGVjICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGxhYmVsID0gbGFiZWwudG9GaXhlZChuZGVjKTtcclxuICB9IGVsc2Uge1xyXG4gICAgbGFiZWwgPSBsYWJlbC50b1N0cmluZygpO1xyXG4gIH1cclxuICAvLyBGb2xsb3dpbmcgYmFzZWQgb24gY29kZSBmcm9tIFxyXG4gIC8vIGh0dHA6Ly93d3cubXJlZGtqLmNvbS9qYXZhc2NyaXB0L251bWJlckZvcm1hdC5odG1sXHJcbiAgeCAgICAgPSBsYWJlbC5zcGxpdCgnLicpO1xyXG4gIHgxICAgID0geFswXTtcclxuICB4MiAgICA9IHgubGVuZ3RoID4gMSA/IGRlYyArIHhbMV0gOiAnJztcclxuICBpZiAoZ3JwICE9PSAnJykge1xyXG4gICAgdmFyIHJneCA9IC8oXFxkKykoXFxkezN9KS87XHJcbiAgICB3aGlsZSAocmd4LnRlc3QoeDEpKSB7XHJcbiAgICAgIHgxID0geDEucmVwbGFjZShyZ3gsICckMScgKyBncnAgKyAnJDInKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuKHgxICsgeDIgKyB1bml0KTtcclxufVxyXG5cclxuXHJcblxyXG4iLCJcclxuLy8gRm9ybWF0IGEgbnVtZXJpYyB2YWx1ZTpcclxuLy8gLSBNYWtlIHN1cmUgaXQgaXMgcm91bmRlZCB0byB0aGUgY29ycmVjdCBudW1iZXIgb2YgZGVjaW1hbHMgKG5kZWMpXHJcbi8vIC0gVXNlIHRoZSBjb3JyZWN0IGRlY2ltYWwgc2VwYXJhdG9yIChkZWMpXHJcbi8vIC0gQWRkIGEgdGhvdXNhbmRzIHNlcGFyYXRvciAoZ3JwKVxyXG5mb3JtYXRfbnVtZXJpYyA9IGZ1bmN0aW9uKGxhYmVsLCB1bml0LCBuZGVjLCBkZWMsIGdycCkge1xyXG4gIGlmIChpc05hTihsYWJlbCkpIHJldHVybiAnJztcclxuICBpZiAodW5pdCA9PT0gdW5kZWZpbmVkKSB1bml0ID0gJyc7XHJcbiAgaWYgKGRlYyA9PT0gdW5kZWZpbmVkKSBkZWMgPSAnLCc7XHJcbiAgaWYgKGdycCA9PT0gdW5kZWZpbmVkKSBncnAgPSAnICc7XHJcbiAgLy8gcm91bmQgbnVtYmVyXHJcbiAgaWYgKG5kZWMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgbGFiZWwgPSBsYWJlbC50b0ZpeGVkKG5kZWMpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBsYWJlbCA9IGxhYmVsLnRvU3RyaW5nKCk7XHJcbiAgfVxyXG4gIC8vIEZvbGxvd2luZyBiYXNlZCBvbiBjb2RlIGZyb20gXHJcbiAgLy8gaHR0cDovL3d3dy5tcmVka2ouY29tL2phdmFzY3JpcHQvbnVtYmVyRm9ybWF0Lmh0bWxcclxuICB4ICAgICA9IGxhYmVsLnNwbGl0KCcuJyk7XHJcbiAgeDEgICAgPSB4WzBdO1xyXG4gIHgyICAgID0geC5sZW5ndGggPiAxID8gZGVjICsgeFsxXSA6ICcnO1xyXG4gIGlmIChncnAgIT09ICcnKSB7XHJcbiAgICB2YXIgcmd4ID0gLyhcXGQrKShcXGR7M30pLztcclxuICAgIHdoaWxlIChyZ3gudGVzdCh4MSkpIHtcclxuICAgICAgeDEgPSB4MS5yZXBsYWNlKHJneCwgJyQxJyArIGdycCArICckMicpO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4oeDEgKyB4MiArIHVuaXQpO1xyXG59O1xyXG5cclxuXHJcblxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8vID09PT0gICAgICAgICAgICAgICAgICAgICAgICAgV0lMS0lOU09OIEFMR09SSVRITSAgICAgICAgICAgICAgICAgICAgICAgID09PT1cclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuXHJcbmZ1bmN0aW9uIHdpbGtpbnNvbl9paShkbWluLCBkbWF4LCBtLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBtbWluLCBtbWF4LCBRLCBwcmVjaXNpb24sIG1pbmNvdmVyYWdlKSB7XHJcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PSBTVUJST1VUSU5FUyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgLy8gVGhlIGZvbGxvd2luZyByb3V0aW5lIGNoZWNrcyBmb3Igb3ZlcmxhcCBpbiB0aGUgbGFiZWxzLiBUaGlzIGlzIHVzZWQgaW4gdGhlIFxyXG4gIC8vIFdpbGtpbnNvbiBsYWJlbGluZyBhbGdvcml0aG0gYmVsb3cgdG8gZW5zdXJlIHRoYXQgdGhlIGxhYmVscyBkbyBub3Qgb3ZlcmxhcC5cclxuICBmdW5jdGlvbiBvdmVybGFwKGxtaW4sIGxtYXgsIGxzdGVwLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBuZGVjKSB7XHJcbiAgICB2YXIgd2lkdGhfbWF4ID0gbHN0ZXAqYXhpc193aWR0aC8obG1heC1sbWluKTtcclxuICAgIGZvciAodmFyIGwgPSBsbWluOyAobCAtIGxtYXgpIDw9IDFFLTEwOyBsICs9IGxzdGVwKSB7XHJcbiAgICAgIHZhciB3ICA9IGNhbGNfbGFiZWxfd2lkdGgobCwgbmRlYyk7XHJcbiAgICAgIGlmICh3ID4gd2lkdGhfbWF4KSByZXR1cm4odHJ1ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4oZmFsc2UpO1xyXG4gIH1cclxuXHJcbiAgLy8gUGVyZm9ybSBvbmUgaXRlcmF0aW9uIG9mIHRoZSBXaWxraW5zb24gYWxnb3JpdGhtXHJcbiAgZnVuY3Rpb24gd2lsa2luc29uX3N0ZXAobWluLCBtYXgsIGssIG0sIFEsIG1pbmNvdmVyYWdlKSB7XHJcbiAgICAvLyBkZWZhdWx0IHZhbHVlc1xyXG4gICAgUSAgICAgICAgICAgICAgID0gUSAgICAgICAgIHx8IFsxMCwgMSwgNSwgMiwgMi41LCAzLCA0LCAxLjUsIDcsIDYsIDgsIDldO1xyXG4gICAgcHJlY2lzaW9uICAgICAgID0gcHJlY2lzaW9uIHx8IFsxLCAgMCwgMCwgMCwgIC0xLCAwLCAwLCAgLTEsIDAsIDAsIDAsIDBdO1xyXG4gICAgbWluY292ZXJhZ2UgICAgID0gbWluY292ZXJhZ2UgfHwgMC44O1xyXG4gICAgbSAgICAgICAgICAgICAgID0gbSB8fCBrO1xyXG4gICAgLy8gY2FsY3VsYXRlIHNvbWUgc3RhdHMgbmVlZGVkIGluIGxvb3BcclxuICAgIHZhciBpbnRlcnZhbHMgICA9IGsgLSAxO1xyXG4gICAgdmFyIGRlbHRhICAgICAgID0gKG1heCAtIG1pbikgLyBpbnRlcnZhbHM7XHJcbiAgICB2YXIgYmFzZSAgICAgICAgPSBNYXRoLmZsb29yKE1hdGgubG9nKGRlbHRhKS9NYXRoLkxOMTApO1xyXG4gICAgdmFyIGRiYXNlICAgICAgID0gTWF0aC5wb3coMTAsIGJhc2UpO1xyXG4gICAgLy8gY2FsY3VsYXRlIGdyYW51bGFyaXR5OyBvbmUgb2YgdGhlIHRlcm1zIGluIHNjb3JlXHJcbiAgICB2YXIgZ3JhbnVsYXJpdHkgPSAxIC0gTWF0aC5hYnMoay1tKS9tO1xyXG4gICAgLy8gaW5pdGlhbGlzZSBlbmQgcmVzdWx0XHJcbiAgICB2YXIgYmVzdDtcclxuICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgcG9zc2libGUgbGFiZWwgcG9zaXRpb25zIHdpdGggZ2l2ZW4ga1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IFEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgLy8gY2FsY3VsYXRlIGxhYmVsIHBvc2l0aW9uc1xyXG4gICAgICB2YXIgdGRlbHRhID0gUVtpXSAqIGRiYXNlO1xyXG4gICAgICB2YXIgdG1pbiAgID0gTWF0aC5mbG9vcihtaW4vdGRlbHRhKSAqIHRkZWx0YTtcclxuICAgICAgdmFyIHRtYXggICA9IHRtaW4gKyBpbnRlcnZhbHMgKiB0ZGVsdGE7XHJcbiAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbnVtYmVyIG9mIGRlY2ltYWxzXHJcbiAgICAgIHZhciBuZGVjICAgPSAoYmFzZSArIHByZWNpc2lvbltpXSkgPCAwID8gTWF0aC5hYnMoYmFzZSArIHByZWNpc2lvbltpXSkgOiAwO1xyXG4gICAgICAvLyBpZiBsYWJlbCBwb3NpdGlvbnMgY292ZXIgcmFuZ2VcclxuICAgICAgaWYgKHRtaW4gPD0gbWluICYmIHRtYXggPj0gbWF4KSB7XHJcbiAgICAgICAgLy8gY2FsY3VsYXRlIHJvdW5kbmVzcyBhbmQgY292ZXJhZ2UgcGFydCBvZiBzY29yZVxyXG4gICAgICAgIHZhciByb3VuZG5lc3MgPSAxIC0gKGkgLSAodG1pbiA8PSAwICYmIHRtYXggPj0gMCkpIC8gUS5sZW5ndGg7XHJcbiAgICAgICAgdmFyIGNvdmVyYWdlICA9IChtYXgtbWluKS8odG1heC10bWluKTtcclxuICAgICAgICAvLyBpZiBjb3ZlcmFnZSBoaWdoIGVub3VnaFxyXG4gICAgICAgIGlmIChjb3ZlcmFnZSA+IG1pbmNvdmVyYWdlICYmICFvdmVybGFwKHRtaW4sIHRtYXgsIHRkZWx0YSwgY2FsY19sYWJlbF93aWR0aCwgYXhpc193aWR0aCwgbmRlYykpIHtcclxuICAgICAgICAgIC8vIGNhbGN1bGF0ZSBzY29yZVxyXG4gICAgICAgICAgdmFyIHRuaWNlID0gZ3JhbnVsYXJpdHkgKyByb3VuZG5lc3MgKyBjb3ZlcmFnZTtcclxuICAgICAgICAgIC8vIGlmIGhpZ2hlc3Qgc2NvcmVcclxuICAgICAgICAgIGlmICgoYmVzdCA9PT0gdW5kZWZpbmVkKSB8fCAodG5pY2UgPiBiZXN0LnNjb3JlKSkge1xyXG4gICAgICAgICAgICBiZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgJ2xtaW4nICA6IHRtaW4sXHJcbiAgICAgICAgICAgICAgICAnbG1heCcgIDogdG1heCxcclxuICAgICAgICAgICAgICAgICdsc3RlcCcgOiB0ZGVsdGEsXHJcbiAgICAgICAgICAgICAgICAnc2NvcmUnIDogdG5pY2UsXHJcbiAgICAgICAgICAgICAgICAnbmRlYycgIDogbmRlY1xyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyByZXR1cm5cclxuICAgIHJldHVybiAoYmVzdCk7XHJcbiAgfVxyXG5cclxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IE1BSU4gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gIC8vIGRlZmF1bHQgdmFsdWVzXHJcbiAgZG1pbiAgICAgICAgICAgICA9IE51bWJlcihkbWluKTtcclxuICBkbWF4ICAgICAgICAgICAgID0gTnVtYmVyKGRtYXgpO1xyXG4gIGlmIChNYXRoLmFicyhkbWluIC0gZG1heCkgPCAxRS0xMCkge1xyXG4gICAgZG1pbiA9IDAuOTYqZG1pbjtcclxuICAgIGRtYXggPSAxLjA0KmRtYXg7XHJcbiAgfVxyXG4gIGNhbGNfbGFiZWxfd2lkdGggPSBjYWxjX2xhYmVsX3dpZHRoIHx8IGZ1bmN0aW9uKCkgeyByZXR1cm4oMCk7fTtcclxuICBheGlzX3dpZHRoICAgICAgID0gYXhpc193aWR0aCB8fCAxO1xyXG4gIFEgICAgICAgICAgICAgICAgPSBRICAgICAgICAgfHwgWzEwLCAxLCA1LCAyLCAyLjUsIDMsIDQsIDEuNSwgNywgNiwgOCwgOV07XHJcbiAgcHJlY2lzaW9uICAgICAgICA9IHByZWNpc2lvbiB8fCBbMSwgIDAsIDAsIDAsICAtMSwgMCwgMCwgIC0xLCAwLCAwLCAwLCAwXTtcclxuICBtaW5jb3ZlcmFnZSAgICAgID0gbWluY292ZXJhZ2UgfHwgMC44O1xyXG4gIG1taW4gICAgICAgICAgICAgPSBtbWluIHx8IDI7XHJcbiAgbW1heCAgICAgICAgICAgICA9IG1tYXggfHwgTWF0aC5jZWlsKDYqbSk7XHJcbiAgLy8gaW5pdGlsaXNlIGVuZCByZXN1bHRcclxuICB2YXIgYmVzdCA9IHtcclxuICAgICAgJ2xtaW4nICA6IGRtaW4sXHJcbiAgICAgICdsbWF4JyAgOiBkbWF4LFxyXG4gICAgICAnbHN0ZXAnIDogKGRtYXggLSBkbWluKSxcclxuICAgICAgJ3Njb3JlJyA6IC0xRTgsXHJcbiAgICAgICduZGVjJyAgOiAwXHJcbiAgICB9O1xyXG4gIC8vIGNhbGN1bGF0ZSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXNcclxuICB2YXIgeCA9IFN0cmluZyhiZXN0LmxzdGVwKS5zcGxpdCgnLicpO1xyXG4gIGJlc3QubmRlYyA9IHgubGVuZ3RoID4gMSA/IHhbMV0ubGVuZ3RoIDogMDtcclxuICAvLyBsb29wIHRob3VnaCBhbGwgcG9zc2libGUgbnVtYmVycyBvZiBsYWJlbHNcclxuICBmb3IgKHZhciBrID0gbW1pbjsgayA8PSBtbWF4OyBrKyspIHsgXHJcbiAgICAvLyBjYWxjdWxhdGUgYmVzdCBsYWJlbCBwb3NpdGlvbiBmb3IgY3VycmVudCBudW1iZXIgb2YgbGFiZWxzXHJcbiAgICB2YXIgcmVzdWx0ID0gd2lsa2luc29uX3N0ZXAoZG1pbiwgZG1heCwgaywgbSwgUSwgbWluY292ZXJhZ2UpO1xyXG4gICAgLy8gY2hlY2sgaWYgY3VycmVudCByZXN1bHQgaGFzIGhpZ2hlciBzY29yZVxyXG4gICAgaWYgKChyZXN1bHQgIT09IHVuZGVmaW5lZCkgJiYgKChiZXN0ID09PSB1bmRlZmluZWQpIHx8IChyZXN1bHQuc2NvcmUgPiBiZXN0LnNjb3JlKSkpIHtcclxuICAgICAgYmVzdCA9IHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcbiAgLy8gZ2VuZXJhdGUgbGFiZWwgcG9zaXRpb25zXHJcbiAgdmFyIGxhYmVscyA9IFtdO1xyXG4gIGZvciAodmFyIGwgPSBiZXN0LmxtaW47IChsIC0gYmVzdC5sbWF4KSA8PSAxRS0xMDsgbCArPSBiZXN0LmxzdGVwKSB7XHJcbiAgICBsYWJlbHMucHVzaChsKTtcclxuICB9XHJcbiAgYmVzdC5sYWJlbHMgPSBsYWJlbHM7XHJcbiAgcmV0dXJuKGJlc3QpO1xyXG59XHJcblxyXG5cclxuIiwiICBcclxuICBncnBoLmxpbmUgPSBncnBoX2dyYXBoX2xpbmU7XHJcbiAgZ3JwaC5tYXAgPSBncnBoX2dyYXBoX21hcDtcclxuICBncnBoLmJ1YmJsZSA9IGdycGhfZ3JhcGhfYnViYmxlO1xyXG4gIGdycGguYmFyID0gZ3JwaF9ncmFwaF9iYXI7XHJcblxyXG4gIHRoaXMuZ3JwaCA9IGdycGg7XHJcblxyXG59KCkpO1xyXG5cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9