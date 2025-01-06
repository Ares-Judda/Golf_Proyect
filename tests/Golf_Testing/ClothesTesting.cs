namespace Golf_testing;
using System;
using System.Net.Http.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;

public class ClothesTesting
{
    [Fact]
    public static async Task Update_Articulo_Success()
    {
        var requestBody = new
        {
            ID_Clothes = 17, 
            actualizaciones = new
            {
                name = "Camiseta Actualizada", 
                price = 20.5
            }
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };

        client.DefaultRequestHeaders.Add("accept", "application/json");

        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PutAsync("/api/clothes/update_articulo", content);
        Assert.True(response.IsSuccessStatusCode, "Se esperaba que la solicitud fuera exitosa.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Artículo actualizado exitosamente", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public static async Task Update_Articulo_Fail_NoFieldsToUpdate()
    {
        var requestBody = new
        {
            ID_Clothes = 31,
            actualizaciones = new { }
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PutAsync("/api/clothes/update_articulo", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido a que no se proporcionaron campos a actualizar.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.Contains("No se proporcionaron campos a actualizar", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public static async Task Update_Articulo_Fail_ItemNotFound()
    {
        var requestBody = new
        {
            ID_Clothes = 9999,
            actualizaciones = new
            {
                name = "Artículo Inexistente",
                price = 50.0
            }
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PutAsync("/api/clothes/update_articulo", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido a que el artículo no fue encontrado.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.Contains("Artículo no encontrado", responseBody, StringComparison.OrdinalIgnoreCase);
    }
    [Fact]
    public static async Task Delete_Articulo_Success()
    {
        var requestBody = new
        {
            ID_Clothes = 41
        };
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var response = await client.DeleteAsync($"/api/clothes/delete_articulo?ID_Clothes={requestBody.ID_Clothes}");
        Assert.True(response.IsSuccessStatusCode, "Se esperaba que la solicitud fuera exitosa.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Artículo eliminado exitosamente", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public static async Task Delete_Articulo_Fail_NoID()
    {
        var requestBody = new
        {
            ID_Clothes = (int?)null // Sin ID de artículo
        };

        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var response = await client.DeleteAsync($"/api/clothes/delete_articulo?ID_Clothes={requestBody.ID_Clothes}");
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido a que no se proporcionó el ID del artículo.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.Contains("ID del artículo no proporcionado", responseBody, StringComparison.OrdinalIgnoreCase);
    }

   [Fact]
    public static async Task Delete_Articulo_Fail_ItemNotFound()
    {
        var requestBody = new
        {
            ID_Clothes = 9999 // ID de artículo no existente
        };

        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var response = await client.DeleteAsync($"/api/clothes/delete_articulo?ID_Clothes={requestBody.ID_Clothes}");
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara porque el artículo no existe.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.Contains("Artículo no encontrado", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public static async Task GetAllArticulos_Test_Success()
    {
        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/clothes/get_all_articulos");
        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }
    [Fact]
    public static async Task GetArticuloByName_Test_Success()
    {
        var articulo = new
        {
            name = "Camisa"
        };
        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(articulo);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/clothes/get_articulo_by_name")
        {
            Content = content
        };
        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }
    [Fact]
    public static async Task GetArticuloByName_Test_Fail()
    {
        var articulo = new
        {
            name = "Random_Cathegory"
        };

        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(articulo);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/clothes/get_articulo_by_name")
        {
            Content = content
        };
        var response = await client.SendAsync(request);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }
    [Fact]
    public static async Task GetArticulosBySelling_Test_Success()
    {
        var venta = new
        {
            ID_Selling = "c42d4edc-ad3f-11ef-a5e3-16ffe0000000"
        };
        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(venta);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/clothes/get_articulos_by_selling")
        {
            Content = content
        };
        var response = await client.SendAsync(request);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }
    [Fact]
    public static async Task GetArticuloBySelling_Test_Fail()
    {
        var selling = new
        {
            ID_Selling = "Random_Cathegory"
        };

        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(selling);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/clothes/get_articulo_by_name")
        {
            Content = content
        };
        var response = await client.SendAsync(request);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }

    [Fact]
    public static async Task get_inventory_by_selling_Success()
    {
        string ID_Selling = "c42d4edc-ad3f-11ef-a5e3-16ffe0270025";
        HttpClient client = new HttpClient();
        client.DefaultRequestHeaders.Add("accept", "application/json");
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ID_Selling);
        var result = await client.GetAsync($"/api/clothes/get_inventory_by_selling/{ID_Selling}");
        result.EnsureSuccessStatusCode();
    }
    [Fact]
    public static async Task get_inventory_by_selling_Fail()
    {
        string ID_Selling = "c42d4edc-ad3f-11ef-0000-000000000000";
        HttpClient client = new HttpClient();
        client.DefaultRequestHeaders.Add("accept", "application/json");
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ID_Selling);
        var result = await client.GetAsync($"/api/clothes/get_inventory_by_selling/{ID_Selling}");
        Assert.False(result.IsSuccessStatusCode, "Se esperaba que la solicitud fallara");
        var responseBody = await result.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }
    [Fact]
    public static async Task SaveArticle_Success()
    {
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var requestBody = new
        {
            name = "Test-Shirt",
            clothecategory = "Casual",
            price = 19.99,
            size = "Mediana",
            quota = 100
        };

        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/clothes/save_article", content);
        Assert.True(response.IsSuccessStatusCode, "Se esperaba que el artículo se guardara exitosamente.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Artículo creado exitosamente", responseBody, StringComparison.OrdinalIgnoreCase);
    }
    [Fact]
    public static async Task SaveArticle_Fail_MissingFields()
    {
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var requestBody = new
        {
            name = "T-Shirt",
            clothecategory = "Casual",
            // price is missing
            size = "M",
            quota = 100
        };
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/clothes/save_article", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido a campos faltantes.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Faltan campos obligatorios", responseBody, StringComparison.OrdinalIgnoreCase);
    }
    [Fact]
    public static async Task SaveArticle_Fail_DatabaseError()
    {
        HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8085")
        };
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var requestBody = new
        {
            name = "Invalid Article",
            clothecategory = "Unknown",
            price = -10.99, // Invalid price
            size = "XXL",//Invalid tag
            quota = -5 // Invalid quota
        };
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/clothes/save_article", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido a un error en la base de datos.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Error al guardar la prenda", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    public class Selling{
    public String ID_Selling{get;set;}
    public String name{get;set;}
    }
    public class article{
    public int ID_Clothes;
    public String name;
    public String clothecategory;
    public int price;
    public int size;
    public int quota;
    }
}