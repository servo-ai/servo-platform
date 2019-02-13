var b3 = require('FSM/core/b3');
var Condition = require('FSM/core/condition');
var utils = require('utils/utils');
var _ = require('underscore');
/**
 * Conditions are used to control flow. They are derived from Condition class. As a general rule, conditions should be read only
 * @module Conditions
 **/
/**
 * returns SUCCESS if the field is valid. field type is either email, credit card, phone number, or a formatted number 
 * 
 */
class IsValidField extends Condition {

    constructor() {
        super();
        this.title = this.name = 'IsValidField';
        /**
         * Node parameters.
         *
         * @property parameters
         * @type {Object}
         *  @property {MemoryField} parameters.fieldName - field name to check
         * @property {string} parameters.fieldType - email, credit card, date, phone number, or a number
         * @property {string} parameters.numberFormat any number format such as 0XXX-XXX. every X could be a digit
         **/
        this.parameters = _.extend(this.parameters, {
            'fieldName': '',
            'fieldType': '',
            'numberFormat': ''
        });
        this.description = "returns SUCCESS if the field is valid. field type is either email, credit card, phone number, or a formatted 'number' (format as a mask like XXX-XXX etc) ";
    }

    /**
     * 
     * @param {Tick} tick 
     * @param {string} value 
     */
    testEmail(tick, value) {

        // consder also ^\S+@\S+$
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(value).toLowerCase()) ? b3.SUCCESS() : b3.FAILURE();
    }


    /**
     * 
     * @param {Tick} tick 
     * @param {string} value 
     */
    testCreditCard(tick, ccNumb) {
        /* This script and many more are available free online at
            The JavaScript Source!! http://javascript.internet.com
            Created by: David Leppek :: https://www.azcode.com/Mod10

            Basically, the alorithum takes each digit, from right to left and muliplies each second
            digit by two. If the multiple is two-digits long (i.e.: 6 * 2 = 12) the two digits of
            the multiple are then added together for a new number (1 + 2 = 3). You then add up the 
            string of numbers, both unaltered and new values and get a total sum. This sum is then
            divided by 10 and the remainder should be zero if it is a valid credit card. Hense the
            name Mod 10 or Modulus 10. */
        // v2.0
        var valid = "0123456789"; // Valid digits in a credit card number
        var len = ccNumb.length; // The length of the submitted cc number
        var iCCN = parseInt(ccNumb); // integer of ccNumb
        var sCCN = ccNumb.toString(); // string of ccNumb
        sCCN = sCCN.replace(/^\s+|\s+$/g, ''); // strip spaces
        var iTotal = 0; // integer total set at zero
        var bNum = true; // by default assume it is a number
        var bResult = false; // by default assume it is NOT a valid cc
        var temp; // temp variable for parsing string
        var calc; // used for calculation of each digit

        // Determine if the ccNumb is in fact all numbers
        for (var j = 0; j < len; j++) {
            temp = "" + sCCN.substring(j, j + 1);
            if (valid.indexOf(temp) == -1) {
                bNum = false;
            }
        }

        // if it is NOT a number, you can either alert to the fact, or just pass a failure
        if (!bNum) {
            /*alert("Not a Number");*/
            bResult = false;
        }

        // Determine if it is the proper length 
        if ((len == 0) && (bResult)) { // nothing, field is blank AND passed above # check
            bResult = false;
        } else { // ccNumb is a number and the proper length - let's see if it is a valid card number
            if (len >= 15) { // 15 or 16 for Amex or V/MC
                for (var i = len; i > 0; i--) { // LOOP throught the digits of the card
                    calc = parseInt(iCCN) % 10; // right most digit
                    calc = parseInt(calc); // assure it is an integer
                    iTotal += calc; // running total of the card number as we loop - Do Nothing to first digit
                    i--; // decrement the count - move to the next digit in the card
                    iCCN = iCCN / 10; // subtracts right most digit from ccNumb
                    calc = parseInt(iCCN) % 10; // NEXT right most digit
                    calc = calc * 2; // multiply the digit by two
                    // Instead of some screwy method of converting 16 to a string and then parsing 1 and 6 and then adding them to make 7,
                    // I use a simple switch statement to change the value of calc2 to 7 if 16 is the multiple.
                    switch (calc) {
                        case 10:
                            calc = 1;
                            break; //5*2=10 & 1+0 = 1
                        case 12:
                            calc = 3;
                            break; //6*2=12 & 1+2 = 3
                        case 14:
                            calc = 5;
                            break; //7*2=14 & 1+4 = 5
                        case 16:
                            calc = 7;
                            break; //8*2=16 & 1+6 = 7
                        case 18:
                            calc = 9;
                            break; //9*2=18 & 1+8 = 9
                        default:
                            calc = calc; //4*2= 8 &   8 = 8  -same for all lower numbers
                    }
                    iCCN = iCCN / 10; // subtracts right most digit from ccNum
                    iTotal += calc; // running total of the card number as we loop
                } // END OF LOOP
                if ((iTotal % 10) == 0) { // check to see if the sum Mod 10 is zero
                    bResult = true; // This IS (or could be) a valid credit card number.
                } else {
                    bResult = false; // This could NOT be a valid credit card number
                }
            }
        }
        // change alert to on-page display or other indication as needed.
        if (bResult) {
            return b3.SUCCESS();
        }
        if (!bResult) {
            b3.FAILURE();
        }
        return b3.FAILURE(); // Return the results
    }

    /**
     * 
     * @param {*} tick 
     * @param {string} value 
     */
    testPhoneNumber(tick, value) {
        function phonenumber1(inputtxt) {
            var phonenos = [/^\+?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})$/,
                /^\+?([0-9]{4})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{3})$/,
                /^\+?([0-9]{3})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{3})$/
            ];
            for (let phoneno of phonenos) {
                if (inputtxt.match(phoneno)) {
                    return true;
                }
            }
            return false;
        }


        function phonenumber(inputtxt) {
            var phoneno = /^05\d{8}$/;
            if (inputtxt.match(phoneno)) {
                return true;
            } else {

                return false;
            }
        }

        let p = phonenumber1(value) || phonenumber(value);
        return p ? b3.SUCCESS() : b3.FAILURE();
    }

    /**
     * 
     * @param {*} tick 
     * @param {string} value 
     * @param {string} mask 
     */
    testNumber(tick, value, mask) {
        let regex = mask.replace(/X/gi, '[0-9]');
        regex = '^' + regex + '$';
        let t = new RegExp(regex);
        return t.test(value) ? b3.SUCCESS() : b3.FAILURE();
    }

    /**
     * Tick method.
     *
     * @private
     * @param {Tick} tick A tick instance.
     * @return {Constant} A state constant.
     **/
    tick(tick) {

        var data = this.alldata(tick);
        let value = _.template(utils.wrapExpression(this.properties.fieldName))(data);
        switch (this.properties.fieldType.toLowerCase()) {
            case 'email':
                return this.testEmail(tick, value);


            case 'credit card':
            case 'creditcard':
            case 'credit-card':
                return this.testCreditCard(tick, value);


            case 'phonenumber':
            case 'phone-number':
            case 'phone number':
                return this.testPhoneNumber(tick, value);



            case 'number':
                return this.testNumber(tick, value, this.properties.numberFormat);

        }

        return b3.FAILURE();

    }

    /**
     * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
     * @return {Array<Validator>}
     */
    validators(node) {

        function validCompositeField(field) {

            var bool1 = field && (field.indexOf('message.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
            var bool2 = field && (field.indexOf('\'') === 0 || field.indexOf('"') === 0 || !isNaN(field));
            return bool1 || bool2;
        }

        return [{
            condition: validCompositeField(node.properties.fieldName),
            text: "fieldName is not a memory field. it should start with \", ', context., global., fsm., volatile. or be a literal number"
        }, {
            condition: node.properties.fieldType !== '',
            text: "fieldType cannot be empty"
        }, {
            condition: node.properties.fieldType || (node.properties.fieldType === 'number' && node.properties.formatNumber !== ''),
            text: "if fieldType is  number, formatNumber should contain a format"
        }];
    }
}

module.exports = IsValidField;