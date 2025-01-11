namespace Golf_testing;
using System;
using System.Net.Http.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
public class ShoppingCartTesting
{
    [Fact]
    public static async Task add_articulo_to_car_Success()
    {
        string userId = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025"; // Usuario válido
        var requestBody = new
        {
            ID_Clothes = 13,
            Quantity = 88
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        Console.WriteLine(json); 
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"/api/shoppingCar/add_articulo_to_car/{userId}", content);
        Assert.True(response.IsSuccessStatusCode, "Se esperaba que la solicitud pasara.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Artículo añadido al carrito exitosamente", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public static async Task add_articulo_to_car_Fail_ID()
    {
        string userId = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025"; 
        var requestBody = new
        {
            ID_Clothes = 999,
            Quantity = 999
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        Console.WriteLine(json);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"/api/shoppingCar/add_articulo_to_car/{userId}", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }
    
    [Fact]
    public static async Task add_articulo_to_car_Fail_User()
    {
        string userId = "00000000-0000-0000-0000-000000000000"; // Usuario inválido
        var requestBody = new
        {
            ID_Clothes = 13,
            Quantity = 2
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        Console.WriteLine(json);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"/api/shoppingCar/add_articulo_to_car/{userId}", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }

    [Fact]
    public static async Task get_shopping_car_Success()
    {
        string ID_Client = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025";
        HttpClient client = new HttpClient();
        client.DefaultRequestHeaders.Add("accept", "application/json");
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ID_Client);
        var result = await client.GetAsync($"/api/shoppingCar/get_shopping_car/{ID_Client}");
        result.EnsureSuccessStatusCode();
    }
    [Fact] //falso negativo
    public static async Task GetShoppingCar_Fail()
    {
        string validToken = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025";
        string invalidClientId = "00000000-0000-0000-0000-000000000000";
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", validToken);
        var result = await client.GetAsync($"/api/shoppingCar/get_shopping_car/{invalidClientId}");
        Assert.False(result.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido a un ID de cliente no válido o sin carrito.");
        var responseBody = await result.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("No se encontraron artículos en el carrito", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public static async Task Update_Quantity_Success()
    {
        var userId = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025";
        var requestBody = new
        {
            ID_Clothes = 31,
            newQuantity = 4 
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PutAsync($"/api/shoppingCar/update_quantity/{userId}", content);
        Assert.True(response.IsSuccessStatusCode, "Se esperaba que la solicitud fuera exitosa.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Cantidad actualizada correctamente", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public static async Task UpdateQuantity_Fail_MissingFields()
    {
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var userId = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025";
        var requestBody = new
        {
            ID_Clothes = 14//falta cantidad
        };
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PutAsync($"/api/shoppingCar/update_quantity/{userId}", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido a campos faltantes.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Faltan campos obligatorios", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public static async Task UpdateQuantity_Fail_ItemNotFound()
    {
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var userId = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025";
        var requestBody = new
        {
            ID_Clothes = 9229, // ID inexistente
            newQuantity = 5
        };
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PutAsync($"/api/shoppingCar/update_quantity/{userId}", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido a un artículo no encontrado.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Artículo no encontrado en el carrito", responseBody, StringComparison.OrdinalIgnoreCase);
    }
}