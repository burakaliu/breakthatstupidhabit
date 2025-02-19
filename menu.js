document.addEventListener('DOMContentLoaded', function() {
    const menuIcon = document.getElementById('menuIcon');
    const sideMenu = document.querySelector('.side-menu');

    //listen fpr clicks on the menu to close or open
    menuIcon.addEventListener('click', function() {
        menuIcon.classList.toggle('active');
        sideMenu.classList.toggle('active');
    });

    // close the menu when you click outside
    document.addEventListener('click', function(event) {
        if (!menuIcon.contains(event.target) && 
            !sideMenu.contains(event.target) && 
            sideMenu.classList.contains('active')) {
            menuIcon.classList.remove('active');
            sideMenu.classList.remove('active');
        }
    });
});