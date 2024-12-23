// Include this JavaScript in your client.js file to handle the delete recipe functionality

document.addEventListener("DOMContentLoaded", () => {
    const recipeNameToDeleteInput = document.getElementById('recipeNameToDelete');
    const deleteRecipeButton = document.getElementById('deleteRecipeButton');

    deleteRecipeButton.addEventListener('click', () => {
        const recipeNameToDelete = recipeNameToDeleteInput.value;

        // Make a DELETE request to delete the recipe by name
        fetch(`/recipes/delete/${recipeNameToDelete}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            console.log(data); // Display the response from the server
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});
