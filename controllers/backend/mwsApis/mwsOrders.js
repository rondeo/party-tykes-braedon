const mongoose = require('mongoose');
const User = mongoose.model('User');
var async = require('async');
var format = require('date-format');
var AmazonProductsSchema = require('./../../../models/amazonProducts');
var AmazonOrdersSchema = require('./../../../models/amazonOrders');

module.exports.fetchAmazonOrders = async (req, res, next) => {

    console.log('Orders Cron Initialised!');

    const myData = await User.find({ 'isMwsVerified': true });

    var orderIDS = [];
    var throttledIds = [];
    var event = new Date();
    var date_ISO = event.toISOString().substring(0, 10);
    var date_string = date_ISO.toString();
    var date = new Date();
    var prev_day = event.setDate(event.getDate() - 1);
    var CreatedAfter = new Date(prev_day);
    var CreatedBefore = new Date();
    var MS_PER_MINUTE = 60000;
    var nextToken = "";
    var amznOrders = [];
    var Created_Before = new Date(CreatedBefore - 5 * MS_PER_MINUTE);

    myData.forEach((item, index) => {

        const amazonMws = require('./../../../lib/amazon-mws')(item.accessKeyId, item.accessSecret);

        // Function to retrieve Basic Order details.
        async function listAllOrders(listAllOrdersCallback) {

            await amazonMws.orders.search({
                'Version': '2013-09-01',
                'Action': 'ListOrders',
                'SellerId': item.SellerID,
                'MWSAuthToken': item.MwsToken,
                'MarketplaceId.Id.1': item.Marketplace,
                'CreatedAfter': CreatedAfter,
                'CreatedBefore': Created_Before

            }, function (error, response) {
                if (error) {
                    console.log('error ', error);
                }

                if (response !== null && response !== undefined) {
                    if (response.Orders.Order == null || response.Orders.Order == undefined) {
                        console.log('no orders available--');
                    }

                    if (response.Orders.Order != null && response.Orders.Order != undefined && response.Orders.Order.constructor === Object) {
                        console.log('object-------');
                        amznOrders[0] = response.Orders.Order;
                        console.log('objects--- amznOrders---', amznOrders);
                    }
                    if (response.Orders.Order != null && response.Orders.Order != undefined && Array.isArray(response.Orders.Order)) {
                        amznOrders = response.Orders.Order;
                    }

                    amznOrders.map((order, key) => {

                        var p_date = format('dd-MM-yyyy', new Date(order.PurchaseDate))

                        const amznOrders = AmazonOrdersSchema({
                            PurchaseDate: p_date,
                            AmazonOrderID: order.AmazonOrderId,
                            BuyerName: order.BuyerName,
                            BuyerEmail: order.BuyerEmail,
                            IsReplacementOrder: order.IsReplacementOrder,
                            OrderTotal: order.OrderTotal ? order.OrderTotal.Amount : '',
                            OrderTotalCurrency: order.OrderTotal ? order.OrderTotal.CurrencyCode : '',
                            OrderStatus: order.OrderStatus,
                            fulfilledBy: order.FulfillmentChannel,
                            idmatch: '',
                            userid: item._id
                        });

                        amznOrders.save(((error) => {
                            if (error) {
                                console.log(error)
                            }
                            console.log('Order Saved!!');
                        }));

                        // Pushing Amazon Order IDS in array for use in further functions.
                        orderIDS.push(order.AmazonOrderId)

                    })
                }
                else {
                    console.log('elseeeeeeee response is null');
                }

                // Using callback function & passing along array of AmazonOrder IDS.
                listAllOrdersCallback(null, orderIDS, nextToken);
            });
        }

        // Function Two for retrieving all the necessary details using above listed Order IDS.
        async function listOrderItems(orderIDS, nextToken, listOrderItemsCallback) {

            if (nextToken != "" && nextToken != null) {
                await amazonMws.orders.search({
                    'Version': '2013-09-01',
                    'Action': 'ListOrdersByNextToken',
                    'SellerId': item.SellerID,
                    'MWSAuthToken': item.MwsToken,
                    'MarketplaceId.Id.1': item.Marketplace,
                    'NextToken': nextToken,
                    'LastUpdatedAfter': CreatedAfter
                }, function (error, response) {
                    if (error) {
                        console.log('error ', error);
                        return;
                    }

                    response.Orders.Order.map((order, key) => {

                        var date = new Date(order.PurchaseDate);
                        var p_date = format('dd-MM-yyyy', new Date(order.PurchaseDate))

                        const amznOrders = AmazonOrdersSchema({
                            PurchaseDate: p_date,
                            AmazonOrderID: order.AmazonOrderId,
                            BuyerName: order.BuyerName,
                            BuyerEmail: order.BuyerEmail,
                            IsReplacementOrder: order.IsReplacementOrder,
                            OrderTotal: order.OrderTotal ? order.OrderTotal.Amount : '',
                            OrderTotalCurrency: order.OrderTotal ? order.OrderTotal.CurrencyCode : '',
                            OrderStatus: order.OrderStatus,
                            fulfilledBy: order.FulfillmentChannel
                        });

                        amznOrders.save(((error) => {
                            if (error) {
                                console.log(error)
                            }
                            console.log('Order Saved by Next token!!');
                        }));

                        // Pushing Amazon Order IDS in array for use in further functions.
                        orderIDS.push(order.AmazonOrderId)
                    })

                    listOrderItemsCallback(null, orderIDS);
                });
            }
            else {
                listOrderItemsCallback(null, orderIDS);
            }
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function UpdateOrderItems(orderIDS, updateOrderItemsCallback) {

            await sleep(6000)

            for (let i = 0; i < orderIDS.length; i++) {

                if (i % 40 === 0)

                    await sleep(6000);

                amazonMws.orders.search({
                    'Version': '2013-09-01',
                    'Action': 'ListOrderItems',
                    'SellerId': item.SellerID,
                    'MWSAuthToken': item.MwsToken,
                    'AmazonOrderId': orderIDS[i]
                }, function (error, response) {
                    if (error) {
                        console.log(`Req throttled for iD ${orderIDS[i]}`);
                        throttledIds.push(orderIDS[i]);
                        return;
                    }

                    var sellersku = response.OrderItems.OrderItem.SellerSKU;

                    AmazonProductsSchema.find({ 'SellerSKU': sellersku }, function (err, data) {

                        if (data) {

                            console.log('------Testng Important Data------', data);

                            // AmazonOrdersSchema.update({ 'AmazonOrderID': orderIDS[i] },
                            //     {
                            //         $set: {
                            //             'idmatch': data[0]._id,
                            //             'buycost': data[0].buycost
                            //         }
                            //     }, (err) => {
                            //         if (err) {
                            //             console.log(err);
                            //         }
                            //         console.log('updated...');
                            //     });
                        }
                    });

                    AmazonOrdersSchema.update({ 'AmazonOrderID': orderIDS[i] },
                        {
                            $set: {
                                'QuantityOrdered': response.OrderItems ? response.OrderItems.OrderItem.QuantityOrdered : '',
                                'QuantityShipped': response.OrderItems ? response.OrderItems.OrderItem.QuantityShipped : '',
                                'ProductTitle': response.OrderItems ? response.OrderItems.OrderItem.Title : '',
                                'SellerSKU': response.OrderItems ? response.OrderItems.OrderItem.SellerSKU : '',
                                'ASIN': response.OrderItems ? response.OrderItems.OrderItem.ASIN : '',
                                'OrderItemId': response.OrderItems ? response.OrderItems.OrderItem.OrderItemId : ''
                            }

                        }, (err) => {
                            if (err) {
                                console.log(err);
                            }
                            console.log('order details updated...');
                        });
                });
            }
            if (throttledIds) {

                for (let i = 0; i < throttledIds.length; i++) {

                    if (i % 40 === 0)

                        await sleep(60000);

                    amazonMws.orders.search({
                        'Version': '2013-09-01',
                        'Action': 'ListOrderItems',
                        'SellerId': item.SellerID,
                        'MWSAuthToken': item.MwsToken,
                        'AmazonOrderId': throttledIds[i]
                    }, function (error, response) {
                        if (error) {
                            console.log(`Req throttled for iD ${throttledIds[i]}`);
                            throttledIds.push(throttledIds[i]);
                            return;
                        }
                        AmazonOrdersSchema.update({ 'AmazonOrderID': throttledIds[i] },
                            {
                                $set: {
                                    'QuantityOrdered': response.OrderItems ? response.OrderItems.OrderItem.QuantityOrdered : '',
                                    'QuantityShipped': response.OrderItems ? response.OrderItems.OrderItem.QuantityShipped : '',
                                    'ProductTitle': response.OrderItems ? response.OrderItems.OrderItem.Title : '',
                                    'SellerSKU': response.OrderItems ? response.OrderItems.OrderItem.SellerSKU : '',
                                    'ASIN': response.OrderItems ? response.OrderItems.OrderItem.ASIN : '',
                                    'OrderItemId': response.OrderItems ? response.OrderItems.OrderItem.OrderItemId : ''
                                }

                            }, (err) => {
                                if (err) {
                                    console.log(err);
                                }
                                console.log('order details updated... after throttling---');
                            });
                    });
                }
            }

            updateOrderItemsCallback(null, orderIDS);
        }

        async function UpdateOrderFees(orderIDS, updateOrderFeesCallback) {

            await sleep(60000)

            for (let i = 0; i < orderIDS.length; i++) {

                if (i % 25 === 0)
                    await sleep(60000);
                amazonMws.finances.search({
                    'Version': '2015-05-01',
                    'Action': 'ListFinancialEvents',
                    'SellerId': item.SellerID,
                    'MWSAuthToken': item.MwsToken,
                    'AmazonOrderId': orderIDS[i]
                }, function (error, response) {
                    if (error) {
                        console.log(`Req throttled for iD ${orderIDS[i]}`);
                        throttledIds.push(orderIDS[i]);
                    }

                    if (response !== null && response !== undefined) {
                        if (Object.entries(response).length === 0 && response.constructor === Object) {
                            console.log('Response is null');
                        } else {

                            if (response.FinancialEvents !== null && response.FinancialEvents !== undefined) {
                                if (Object.entries(response.FinancialEvents).length === 0 && response.FinancialEvents.constructor === Object) {
                                    console.log('Financial Events doesnt exist');
                                } else {

                                    if (response.FinancialEvents.ShipmentEventList !== null && response.FinancialEvents.ShipmentEventList !== undefined) {

                                        if (response.FinancialEvents.ShipmentEventList.ShipmentEvent !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent !== undefined) {

                                            if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.constructor === Object) {
                                                console.log('Shipment Event is null.')
                                            } else {

                                                if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList !== undefined) {
                                                    if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.constructor === Object) {
                                                        console.log('Shipment Item List is null.');
                                                    } else {
                                                        if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem !== undefined) {
                                                            if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.constructor === Object) {
                                                                console.log('Shipment Item is null.')
                                                            } else {
                                                                if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList !== undefined) {
                                                                    if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.constructor === Object) {
                                                                        console.log('Item Charge List is null.')
                                                                    } else {

                                                                        if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent !== undefined) {
                                                                            if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent.constructor === Object) {
                                                                                console.log('Item Charge List is null.')
                                                                            } else {

                                                                                AmazonOrdersSchema.update({ 'AmazonOrderID': orderIDS[i] },
                                                                                    {
                                                                                        $set: {
                                                                                            'Principal': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[0].ChargeAmount.CurrencyAmount,
                                                                                            'PrincipalCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[0].ChargeAmount.CurrencyCode,
                                                                                            'Tax': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[1].ChargeAmount.CurrencyAmount,
                                                                                            'TaxCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[1].ChargeAmount.CurrencyCode,
                                                                                            'GiftWrap': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[2].ChargeAmount.CurrencyAmount,
                                                                                            'GiftWrapCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[2].ChargeAmount.CurrencyCode,
                                                                                            'GiftWrapTax': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[3].ChargeAmount.CurrencyAmount,
                                                                                            'GiftWrapTaxCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[3].ChargeAmount.CurrencyCode,
                                                                                            'ShippingCharge': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[4].ChargeAmount.CurrencyAmount,
                                                                                            'ShippingChargeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[4].ChargeAmount.CurrencyCode,
                                                                                            'ShippingTax': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[5].ChargeAmount.CurrencyAmount,
                                                                                            'ShippingTaxCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[5].ChargeAmount.CurrencyCode,

                                                                                        }
                                                                                    }, (err) => {
                                                                                        if (err) {
                                                                                            console.log(err);
                                                                                        }
                                                                                        console.log('charges updated---------');
                                                                                    });
                                                                            }
                                                                        } else {
                                                                            console.log('Null/Undefined Charge Component!');
                                                                        }
                                                                    }
                                                                } else {
                                                                    console.log('Null/Undefined Item Charge List!');
                                                                }
                                                            }
                                                        } else {
                                                            console.log('Null/Undefined Shipment Item!');
                                                        }
                                                    }
                                                } else {
                                                    console.log('Null/Undefined Shipment Item List!');
                                                }
                                            }
                                        } else {
                                            console.log('Null/Undefined Shipment Event!');
                                        }
                                    } else {
                                        console.log('Null/Undefined Shipment Event List!');
                                    }
                                }
                            } else {
                                console.log('Null/Undefined Financial Events!');
                            }
                        }
                    } else {
                        console.log('Null/undefined response!');
                    }
                });

            }
            if (throttledIds) {
                for (let i = 0; i < throttledIds.length; i++) {
                    //console.log('before-----', i);

                    if (i % 25 === 0)
                        await sleep(60000);
                    amazonMws.finances.search({
                        'Version': '2015-05-01',
                        'Action': 'ListFinancialEvents',
                        'SellerId': item.SellerID,
                        'MWSAuthToken': item.MwsToken,
                        'AmazonOrderId': throttledIds[i]
                    }, function (error, response) {
                        if (error) {
                            console.log(`Req throttled for iD ${throttledIds[i]}`);
                            throttledIds.push(throttledIds[i]);
                            //return;
                        }

                        if (response !== null && response !== undefined) {
                            if (Object.entries(response).length === 0 && response.constructor === Object) {
                                console.log('Response is null');
                            } else {

                                if (response.FinancialEvents !== null && response.FinancialEvents !== undefined) {
                                    if (Object.entries(response.FinancialEvents).length === 0 && response.FinancialEvents.constructor === Object) {
                                        console.log('Financial Events doesnt exist');
                                    } else {

                                        if (response.FinancialEvents.ShipmentEventList !== null && response.FinancialEvents.ShipmentEventList !== undefined) {

                                            if (response.FinancialEvents.ShipmentEventList.ShipmentEvent !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent !== undefined) {

                                                if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.constructor === Object) {
                                                    console.log('Shipment Event is null.')
                                                } else {

                                                    if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList !== undefined) {
                                                        if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.constructor === Object) {
                                                            console.log('Shipment Item List is null.');
                                                        } else {
                                                            if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem !== undefined) {
                                                                if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.constructor === Object) {
                                                                    console.log('Shipment Item is null.')
                                                                } else {
                                                                    if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList !== undefined) {
                                                                        if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.constructor === Object) {
                                                                            console.log('Item Charge List is null.')
                                                                        } else {

                                                                            if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent !== undefined) {
                                                                                if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent.constructor === Object) {
                                                                                    console.log('Item Charge List is null.')
                                                                                } else {

                                                                                    AmazonOrdersSchema.update({ 'AmazonOrderID': throttledIds[i] },
                                                                                        {
                                                                                            $set: {
                                                                                                'Principal': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[0].ChargeAmount.CurrencyAmount,
                                                                                                'PrincipalCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[0].ChargeAmount.CurrencyCode,
                                                                                                'Tax': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[1].ChargeAmount.CurrencyAmount,
                                                                                                'TaxCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[1].ChargeAmount.CurrencyCode,
                                                                                                'GiftWrap': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[2].ChargeAmount.CurrencyAmount,
                                                                                                'GiftWrapCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[2].ChargeAmount.CurrencyCode,
                                                                                                'GiftWrapTax': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[3].ChargeAmount.CurrencyAmount,
                                                                                                'GiftWrapTaxCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[3].ChargeAmount.CurrencyCode,
                                                                                                'ShippingCharge': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[4].ChargeAmount.CurrencyAmount,
                                                                                                'ShippingChargeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[4].ChargeAmount.CurrencyCode,
                                                                                                'ShippingTax': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[5].ChargeAmount.CurrencyAmount,
                                                                                                'ShippingTaxCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemChargeList.ChargeComponent[5].ChargeAmount.CurrencyCode,

                                                                                            }
                                                                                        }, (err) => {
                                                                                            if (err) {
                                                                                                console.log(err);
                                                                                            }
                                                                                            console.log('charges updated after throttling---------');
                                                                                        });
                                                                                }
                                                                            } else {
                                                                                console.log('Null/Undefined Charge Component!');
                                                                            }
                                                                        }
                                                                    } else {
                                                                        console.log('Null/Undefined Item Charge List!');
                                                                    }
                                                                }
                                                            } else {
                                                                console.log('Null/Undefined Shipment Item!');
                                                            }
                                                        }
                                                    } else {
                                                        console.log('Null/Undefined Shipment Item List!');
                                                    }
                                                }
                                            } else {
                                                console.log('Null/Undefined Shipment Event!');
                                            }
                                        } else {
                                            console.log('Null/Undefined Shipment Event List!');
                                        }
                                    }
                                } else {
                                    console.log('Null/Undefined Financial Events!');
                                }
                            }
                        } else {
                            console.log('Null/undefined response!');
                        }
                    });

                }
            }

            updateOrderFeesCallback(null, orderIDS);
        }

        async function UpdateOrderCharges(orderIDS, updateOrderChargesCallback) {
            await sleep(60000)
            for (let i = 0; i < orderIDS.length; i++) {

                if (i % 25 === 0)
                    await sleep(60000);
                amazonMws.finances.search({
                    'Version': '2015-05-01',
                    'Action': 'ListFinancialEvents',
                    'SellerId': item.SellerID,
                    'MWSAuthToken': item.MwsToken,
                    'AmazonOrderId': orderIDS[i]
                }, function (error, response) {
                    if (error) {
                        console.log(`Req throttled for iD ${orderIDS[i]}`);
                        throttledIds.push(orderIDS[i]);
                        return;
                    }

                    if (response !== null && response !== undefined) {
                        if (Object.entries(response).length === 0 && response.constructor === Object) {
                            console.log('Response is null');
                        } else {

                            if (response.FinancialEvents !== null && response.FinancialEvents !== undefined) {
                                if (Object.entries(response.FinancialEvents).length === 0 && response.FinancialEvents.constructor === Object) {
                                    console.log('Financial Events doesnt exist');
                                } else {

                                    if (response.FinancialEvents.ShipmentEventList !== null && response.FinancialEvents.ShipmentEventList !== undefined) {
                                        if (Object.entries(response.FinancialEvents.ShipmentEventList).length === 0 && response.FinancialEvents.ShipmentEventList.constructor === Object) {
                                            console.log('Shipment Event iss null.')
                                        } else {

                                            if (response.FinancialEvents.ShipmentEventList.ShipmentEvent !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent !== undefined) {
                                                if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.constructor === Object) {
                                                    console.log('Shipment Event is null.')
                                                } else {

                                                    if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList !== undefined) {
                                                        if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.constructor === Object) {
                                                            console.log('Shipment Item List is null.');
                                                        } else {
                                                            if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem !== undefined) {
                                                                if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.constructor === Object) {
                                                                    console.log('Shipment Item is null.')
                                                                } else {

                                                                    if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList !== undefined) {
                                                                        if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.constructor === Object) {
                                                                            console.log('Item Charge List is null.')
                                                                        } else {

                                                                            if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent !== undefined) {
                                                                                if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent.constructor === Object) {
                                                                                    console.log('Item Charge List is null.')
                                                                                } else {


                                                                                    AmazonOrdersSchema.update({ 'AmazonOrderID': orderIDS[i] },
                                                                                        {
                                                                                            $set: {

                                                                                                'FBAPerOrderFulfillmentFee': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[0].FeeAmount.CurrencyAmount,
                                                                                                'FBAPerOrderFulfillmentFeeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[0].FeeAmount.CurrencyCode,
                                                                                                'FBAPerUnitFulfillmentFee': Math.abs(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[1].FeeAmount.CurrencyAmount),
                                                                                                'FBAPerUnitFulfillmentFeeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[1].FeeAmount.CurrencyCode,
                                                                                                'FBAWeightBasedFee': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[2].FeeAmount.CurrencyAmount,
                                                                                                'FBAWeightBasedFeeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[2].FeeAmount.CurrencyCode,
                                                                                                'Commission': Math.abs(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[3].FeeAmount.CurrencyAmount),
                                                                                                'CommissionCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[3].FeeAmount.CurrencyCode,
                                                                                                'FixedClosingFee': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[4].FeeAmount.CurrencyAmount,
                                                                                                'FixedClosingFeeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[4].FeeAmount.CurrencyCode,
                                                                                                'GiftwrapChargeback': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[5].FeeAmount.CurrencyAmount,
                                                                                                'GiftwrapChargebackCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[5].FeeAmount.CurrencyCode,
                                                                                                'SalesTaxCollectionFee': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[6].FeeAmount.CurrencyAmount,
                                                                                                'SalesTaxCollectionFeeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[6].FeeAmount.CurrencyCode,
                                                                                                'ShippingChargeback': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[7].FeeAmount.CurrencyAmount,
                                                                                                'ShippingChargebackCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[7].FeeAmount.CurrencyCode
                                                                                            }

                                                                                        }, (err) => {
                                                                                            if (err) {
                                                                                                console.log(err);
                                                                                            }
                                                                                            console.log('FEES UPDATED!');
                                                                                        });
                                                                                }
                                                                            } else {
                                                                                console.log('Null/undefined Fee Component!');
                                                                            }
                                                                        }
                                                                    } else {
                                                                        console.log('Null/undefined Item Fee List!');
                                                                    }
                                                                }
                                                            } else {
                                                                console.log('Null/undefined Shipment Item!');
                                                            }
                                                        }
                                                    } else {
                                                        console.log('Null/undefined Shipment Item List!');
                                                    }
                                                }
                                            } else {
                                                console.log('Null/undefined Shipment Event!');
                                            }
                                        }
                                    } else {
                                        console.log('Null/undefined Shipment Event List!');
                                    }
                                }
                            } else {
                                console.log('Null/undefined Financial Events!');
                            }
                        }
                    } else {
                        console.log('Null/undefined response!');
                    }
                });

            }
            if (throttledIds) {
                for (let i = 0; i < throttledIds.length; i++) {

                    if (i % 25 === 0)
                        await sleep(60000);
                    amazonMws.finances.search({
                        'Version': '2015-05-01',
                        'Action': 'ListFinancialEvents',
                        'SellerId': item.SellerID,
                        'MWSAuthToken': item.MwsToken,
                        'AmazonOrderId': throttledIds[i]
                    }, function (error, response) {
                        if (error) {
                            console.log(`Req throttled for iD ${throttledIds[i]}`);
                            throttledIds.push(throttledIds[i]);
                            return;
                        }

                        if (response !== null && response !== undefined) {
                            if (Object.entries(response).length === 0 && response.constructor === Object) {
                                console.log('Response is null');
                            } else {

                                if (response.FinancialEvents !== null && response.FinancialEvents !== undefined) {
                                    if (Object.entries(response.FinancialEvents).length === 0 && response.FinancialEvents.constructor === Object) {
                                        console.log('Financial Events doesnt exist');
                                    } else {

                                        if (response.FinancialEvents.ShipmentEventList !== null && response.FinancialEvents.ShipmentEventList !== undefined) {
                                            if (Object.entries(response.FinancialEvents.ShipmentEventList).length === 0 && response.FinancialEvents.ShipmentEventList.constructor === Object) {
                                                console.log('Shipment Event iss null.')
                                            } else {

                                                if (response.FinancialEvents.ShipmentEventList.ShipmentEvent !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent !== undefined) {
                                                    if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.constructor === Object) {
                                                        console.log('Shipment Event is null.')
                                                    } else {

                                                        if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList !== undefined) {
                                                            if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.constructor === Object) {
                                                                console.log('Shipment Item List is null.');
                                                            } else {

                                                                if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem !== undefined) {
                                                                    if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.constructor === Object) {
                                                                        console.log('Shipment Item is null.')
                                                                    } else {

                                                                        if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList !== undefined) {
                                                                            if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.constructor === Object) {
                                                                                console.log('Item Charge List is null.')
                                                                            } else {

                                                                                if (response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent !== null && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent !== undefined) {
                                                                                    if (Object.entries(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent).length === 0 && response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent.constructor === Object) {
                                                                                        console.log('Item Charge List is null.')
                                                                                    } else {


                                                                                        AmazonOrdersSchema.update({ 'AmazonOrderID': throttledIds[i] },
                                                                                            {
                                                                                                $set: {

                                                                                                    'FBAPerOrderFulfillmentFee': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[0].FeeAmount.CurrencyAmount,
                                                                                                    'FBAPerOrderFulfillmentFeeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[0].FeeAmount.CurrencyCode,
                                                                                                    'FBAPerUnitFulfillmentFee': Math.abs(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[1].FeeAmount.CurrencyAmount),
                                                                                                    'FBAPerUnitFulfillmentFeeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[1].FeeAmount.CurrencyCode,
                                                                                                    'FBAWeightBasedFee': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[2].FeeAmount.CurrencyAmount,
                                                                                                    'FBAWeightBasedFeeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[2].FeeAmount.CurrencyCode,
                                                                                                    'Commission': Math.abs(response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[3].FeeAmount.CurrencyAmount),
                                                                                                    'CommissionCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[3].FeeAmount.CurrencyCode,
                                                                                                    'FixedClosingFee': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[4].FeeAmount.CurrencyAmount,
                                                                                                    'FixedClosingFeeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[4].FeeAmount.CurrencyCode,
                                                                                                    'GiftwrapChargeback': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[5].FeeAmount.CurrencyAmount,
                                                                                                    'GiftwrapChargebackCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[5].FeeAmount.CurrencyCode,
                                                                                                    'SalesTaxCollectionFee': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[6].FeeAmount.CurrencyAmount,
                                                                                                    'SalesTaxCollectionFeeCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[6].FeeAmount.CurrencyCode,
                                                                                                    'ShippingChargeback': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[7].FeeAmount.CurrencyAmount,
                                                                                                    'ShippingChargebackCurrency': response.FinancialEvents.ShipmentEventList.ShipmentEvent.ShipmentItemList.ShipmentItem.ItemFeeList.FeeComponent[7].FeeAmount.CurrencyCode
                                                                                                }

                                                                                            }, (err) => {
                                                                                                if (err) {
                                                                                                    console.log(err);
                                                                                                }
                                                                                                console.log('FEES UPDATED! after throttling');
                                                                                            });
                                                                                    }
                                                                                } else {
                                                                                    console.log('Null/undefined Fee Component!');
                                                                                }
                                                                            }
                                                                        } else {
                                                                            console.log('Null/undefined Item Fee List!');
                                                                        }
                                                                    }
                                                                } else {
                                                                    console.log('Null/undefined Shipment Item!');
                                                                }
                                                            }
                                                        } else {
                                                            console.log('Null/undefined Shipment Item List!');
                                                        }
                                                    }
                                                } else {
                                                    console.log('Null/undefined Shipment Event!');
                                                }
                                            }
                                        } else {
                                            console.log('Null/undefined Shipment Event List!');
                                        }
                                    }
                                } else {
                                    console.log('Null/undefined Financial Events!');
                                }
                            }
                        } else {
                            console.log('Null/undefined response!');
                        }
                    });

                }
            }

            updateOrderChargesCallback;
        }

        async.waterfall([
            listAllOrders,
            listOrderItems,
            UpdateOrderItems,
            UpdateOrderFees,
            UpdateOrderCharges

        ], (error) => {
            if (error) {
                console.log(error);
            }
        })
    })
}

