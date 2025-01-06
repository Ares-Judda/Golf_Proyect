namespace Golf_testing;
using System;
using System.Net.Http.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
public class SalesTesting
{
    public static async Task get_purchase_history_by_client_Success()
    {
        string userId = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025";
        HttpClient client = new HttpClient();
        client.DefaultRequestHeaders.Add("accept", "application/json");
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userId);
        var result = await client.GetAsync($"/api/sales/get_purchase_history_by_client/{userId}");
        result.EnsureSuccessStatusCode();//Sale fail si no tiene articulos
    }
    
    //TOKEN FAIL
    [Fact]
    public static async Task GetPurchaseHistoryByClient_TokenRejected_Fail()
    {
        string invalidToken = "00000000-0000-0000-0000-000000000000"; // Invalid or expired token
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", invalidToken);
        var result = await client.GetAsync($"/api/sales/get_purchase_history_by_client/{invalidToken}");
        Assert.False(result.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido al rechazo del token.");
        var responseBody = await result.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        if (result.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            Assert.Contains("Token no válido o expirado", responseBody, StringComparison.OrdinalIgnoreCase);
        }
        else
        {
            Assert.True(false, "El middleware no rechazó el token inválido como se esperaba.");
        }
    }
    
    [Fact]
    public static async Task get_purchase_history_by_client_Fail_WRONG_USER()
    {
        string userId = "00000000-0000-0000-0000-000000000000";
        HttpClient client = new HttpClient();
        client.DefaultRequestHeaders.Add("accept", "application/json");
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userId);
        var result = await client.GetAsync($"/api/sales/get_purchase_history_by_client/{userId}");
        Assert.False(result.IsSuccessStatusCode, "Se esperaba que la solicitud fallara");
        var responseBody = await result.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }

    //FUNCIONA PRECARGAR CARRO CON OBJETO PRUEBA
   [Fact]
    public static async Task BuyShoppingCar_Test_Success()
    {
        string userId = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025";//Usuario loggeado
        var updatedClothes = new[]
        { //Tienen que corresponder a carrito
            new { ID_Clothes = "13", newQuantity = 1 },
            new { ID_Clothes = "14", newQuantity = 1 }
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var requestBody = new
        {
            updatedClothes
        };
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"/api/sales/buy_shopping_car/{userId}", content);
        Assert.True(response.IsSuccessStatusCode, "Se esperaba que la solicitud pasara.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Compra procesada correctamente", responseBody, StringComparison.OrdinalIgnoreCase);
    }*/

    [Fact]
    public static async Task BuyShoppingCar_Test_Fail_WrongUser()
    {
        string userId = "00000000-0000-0000-0000-000000000000";//Usuario loggeado
        var updatedClothes = new[]
        {
            new { ID_Clothes = "999", newQuantity = 222 },
            new { ID_Clothes = "999", newQuantity = 222 }
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var requestBody = new
        {
            updatedClothes
        };
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"/api/sales/buy_shopping_car/{userId}", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        
    }

    [Fact]
    public static async Task BuyShoppingCar_Test_Fail_Wrong_Qty()
    {
        string userId = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025";//Usuario loggeado
        var updatedClothes = new[]
        { //Tienen que corresponder a carrito
            new { ID_Clothes = "14", newQuantity = 400 },
            new { ID_Clothes = "9", newQuantity = 400 }
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var requestBody = new
        {
            updatedClothes
        };
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"/api/sales/buy_shopping_car/{userId}", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }
}