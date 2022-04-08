// Switch category
window.onload = () => {
    const tab_switchers = document.querySelectorAll('[data-switcher]');
    for (let i = 0; i< tab_switchers.length; i++) {
        const tab_switcher = tab_switchers[i];
        const page_id = tab_switcher.dataset.tab;
        tab_switcher.addEventListener('click', () => {
            document.querySelector('header ul li.is-active').classList.remove('is-active');
            tab_switcher.parentNode.classList.add('is-active');
            SwitchPage(page_id)
        });
    }
}

function SwitchPage (page_id) {
    // const popup = $('#productPopup');
    const current_page = document.querySelector('section:first-of-type div.is-active');
    current_page.classList.remove('is-active');
    const next_page = document.querySelector(`section:first-of-type div[data-page="${page_id}"]`);
    next_page.classList.add('is-active');
    // sausjes only available on friet and snacks
        const sausOptie = $('.sauzen');
        const sausOptie1 = $('.optie1');
        const sausOptie2 = $('.optie2');
        const sausOptie3 = $('.optie3');

        // data tab friet
        if (next_page.innerHTML.indexOf('Friet') != -1){
            sausOptie.removeClass('sauzenNo');
        }
        // data tab snacks 
        else if(next_page.innerHTML.indexOf('Frikandel') != -1){
            sausOptie.removeClass('sauzenNo')
        } 
        // else if(next_page.innerHTML.indexOf('Saus Klein') != -1){
        //     sausOptie.removeClass('sauzenNo');
        //     // sausOptie3.addClass('sauzenNo');
        // }
        else{
        sausOptie.addClass('sauzenNo');
        }
}
// Enable Popup
const selectProduct = $('.order');
const disableScroll = $('body')
const popup = $('#productPopup');
const closePopup = $('.closePopupButton');

selectProduct.on('click', function(){
   var cur = $(this);
   var data = cur.data('product');
   popup.find('[data-product-image]').attr({'src': data.image, 'alt': data.title});
   popup.find('[data-product-title]').html(data.title);
   popup.find('[data-product-price]').val(data.price);
   popup.find('[data-product-id]').val(data._id);
    popup.addClass('popupEnabled');
    $('body').addClass('disableScroll');
    console.log(data.title);
    
    if(data.title == 'Friet Klein' || data.title == 'Friet Middel'){
        $('.optie1').removeClass('sauzenNo');
        $('.optie2').addClass('sauzenNo');
        $('.optie3').addClass('sauzenNo');
    }
    else if(data.title == 'Friet Groot'){
        // $('.sauzen').removeClass('sauzenNo');
        $('.optie1').addClass('sauzenNo');
        $('.optie2').removeClass('sauzenNo');
    } else if(data.title == 'huzaren slaatje'){
        $('.optie1').addClass('sauzenNo');
    } 
    // else if(data.title == 'Saus Klein'){
    //     $('.optie1').removeClass('sauzenNo');
    // } else if(data.title == 'Saus Groot'){
    //     $('.optie1').addClass('sauzenNo');
    //     $('.optie2').removeClass('sauzenNo');

    // }
    else if(data.title == 'Bolletje'){
        $('.optie1').addClass('sauzenNo');
    }
    else if(data.title == 'Frikandel'){
        $('.optie3').removeClass('sauzenNo');
        $('.optie1').addClass('sauzenNo');
        $('.optie2').addClass('sauzenNo');
    }
    // if(data.title == 'Kroket rundvlees' || data.title == 'kalfskroket'){
    //     $('.optie1').removeClass('sauzenNo');
    // }
    else{
        $('.optie1').removeClass('sauzenNo');
        $('.optie2').addClass('sauzenNo');
        $('.optie3').addClass('sauzenNo');
    }
});

closePopup.on('click', function(){
    popup.removeClass('popupEnabled');
    $('body').removeClass('disableScroll');
});

$(document).mouseup(function(e) {
    var container = popup.find('.popupScreen');

    if (!container.is(e.target) && container.has(e.target).length === 0) 
    {
        popup.removeClass('popupEnabled');
    $('body').removeClass('disableScroll');
    }
});

function disablePopup(){
    popup.classList.remove('popupEnabled')
    popup.classList.add('popupDisabled')
    disableScroll.classList.remove('disableScroll')
}

// Product counter 
$('.quantity button').on('click', function(){
    var cur = $(this);
    var input = cur.closest('.quantity').find('input');
    var quantity = parseInt(input.val());
    var way = cur.data('way');
    var min = input.attr('min');
    var max = input.attr('max');

    if (way == 'up') {
        if (quantity != max) {
            quantity++;
        } else {
            input.addClass('quantityError');
            setTimeout(function(){
                input.removeClass('quantityError');
            }, 800);
        }
    }

    if (way == 'down') {
        if (quantity != min) {
            quantity--;
        } else {
            input.addClass('quantityError');
            setTimeout(function(){
                input.removeClass('quantityError');
            }, 800);
        }
    }
    input.val(quantity);
});

$('.addToCart').on('click', function() {
    input.value = 1;
    count = 1;

    $('.addToCart').addClass('buttonClicked');
    setTimeout(function(){
        $('.addToCart').removeClass('buttonClicked');
            popup.removeClass('popupEnabled')
            popup.addClass('popupDisabled')
            disableScroll.removeClass('disableScroll')
    }, 800);    
});

var sum = 0;
$('.price').each(function(){
    sum += parseFloat(this.value);
});
$('.totalPrice').html(money(sum))
$('.totalPrice').val(sum)


$('.sausList input').on('change', function(){
    var price = $(this).attr('data-price');
    $('input[name="extra_price"]').val(price);
});

// Open and closed order page
var closedOrder = $('.closedOrder')
var closedOrderList = $('#closedOrder')
var openOrder = $('.openOrder')
var openOrderList = $('#openOrder')
var exportButton = $('.export')
var logoutButton = $('.logout')

openOrder.on('click', function(){
    openOrder.addClass('selectedList')
    openOrderList.removeClass('hideList')
    closedOrder.removeClass('selectedList')
    closedOrderList.addClass('hideList')
    exportButton.addClass('hideList')
    exportButton.removeClass('showButton')
    logoutButton.addClass('showButton')
    logoutButton.removeClass('hideList')
})
closedOrder.on('click', function(){
    openOrder.removeClass('selectedList')
    openOrderList.addClass('hideList')
    closedOrder.addClass('selectedList')
    closedOrderList.removeClass('hideList')
    exportButton.addClass('showButton')
    exportButton.removeClass('hideList')
    logoutButton.addClass('hideList')
    logoutButton.removeClass('showButton')
})

function money(price) { if (price) { price=parseFloat(price).toFixed(2); price +='' ; var shopCurrency='€' ; var
        x=price.split('.'); var x1=x[0]; var x2=x.length> 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        var x3 = (x1 + x2).split('.');
        var x4 = x3[0].replace(',', '.') + ',' + x3[1];

        var priceMoney = shopCurrency + '' + x4;
        } else {
        var priceMoney = '';
        }
        return priceMoney;
        }

var aside = $('aside');

aside.on('click', function(){
    if (aside.hasClass('closedReceipt')){
        aside.addClass('openReceipt');
        aside.removeClass('closedReceipt');
    }
    else{
        aside.removeClass('openReceipt');
        aside.addClass('closedReceipt');
    }
})

window.addEventListener('load', function popups(){
    const alertMessage = $('.alertMessage');
    const alertMsg = $('.alertMsg');
    const urlResult = location.search.slice(1).split("&")[0].split("=")[1];
    const urlVar = location.search.slice(1).split("&")[0].split("=")[0];

    alertMsg.text(urlResult)
    if (urlVar === 'message'){
        alertMessage.addClass('Succes');
        alertMessage.addClass('showMessage');
        setTimeout(function(){
            alertMessage.removeClass('showMessage');
        },3000);
    }
    if (urlVar === 'error'){
        alertMessage.addClass('Failed');
        alertMessage.addClass('showMessage');
        setTimeout(function(){
            alertMessage.removeClass('showMessage');
        },3000);
    }
    else{
    }
})
