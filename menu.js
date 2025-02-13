document.addEventListener('DOMContentLoaded', function() {
    const menuIcon = document.getElementById('menuIcon');
    const sideMenu = document.querySelector('.side-menu');

    menuIcon.addEventListener('click', function() {
        menuIcon.classList.toggle('active');
        sideMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!menuIcon.contains(event.target) && 
            !sideMenu.contains(event.target) && 
            sideMenu.classList.contains('active')) {
            menuIcon.classList.remove('active');
            sideMenu.classList.remove('active');
        }
    });
});