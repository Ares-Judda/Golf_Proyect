namespace Golf_testing;
using System;
using System.Net.Http.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
public class UserTesting

{
    public static async Task GetAllUsuarios_Test_Success()
        {
        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "12e54ce2-cbc9-11ef-a5e3-16ffe0270025");

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/usuarios/get_all_usuarios");
        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody); 
        Assert.Contains("usuarios", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public static async Task User_GetUser_Test_Success()
    {
        string uid = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025";
        HttpClient client = new HttpClient();
        client.DefaultRequestHeaders.Add("accept", "application/json");
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", uid);
        var result = await client.GetAsync($"/api/usuarios/get_usuario/{uid}");
        result.EnsureSuccessStatusCode();
    }
    [Fact]
    public static async Task User_GetUser_Test_Failure()
    {
        string uid = "00000000-0000-0000-0000-000000000000";
        HttpClient client = new HttpClient();
        client.DefaultRequestHeaders.Add("accept", "application/json");
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", uid);
        var result = await client.GetAsync($"/api/usuarios/get_usuario/{uid}");
        Assert.False(result.IsSuccessStatusCode, $"La solicitud no falló como se esperaba. Código: {result.StatusCode}");
    }

    [Fact]
    public static async Task UploadImage_Test_Success()
    {
        byte[] imageBytes = new byte[] { 255, 216, 255 };
        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var content = new MultipartFormDataContent
        {
            { new ByteArrayContent(imageBytes), "profileImage", "profile.jpg" }
        };
        var response = await client.PostAsync("api/images/upload_image", content);
        Assert.True(response.IsSuccessStatusCode, $"La solicitud falló con el estado: {response.StatusCode}");
    }

    [Fact] 
    public static async Task UploadImage_Test_Failure()
    {
        byte[] invalidImageBytes = new byte[] { };
        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var content = new MultipartFormDataContent
        {
            { new ByteArrayContent(invalidImageBytes), "profileImage", "profile.jpg" }
        };
        var response = await client.PostAsync("api/images/upload_image", content);
        Assert.False(response.IsSuccessStatusCode, $"La solicitud no falló como se esperaba. Código: {response.StatusCode}");
    }

    [Fact]
    public static async Task Update_User_Name_Success()
    {
        var userId = "12e54ce2-cbc9-11ef-a5e3-16ffe0270025"; // ID del usuario a actualizar
        var requestBody = new
        {
            actualizaciones = new
            {
                name = "Alesis de Jesus" // Cambiar el nombre de Alesis a Alesis de Jesus
            }
        };

        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Put, $"/api/usuarios/update_usuario/{userId}")
        {
            Content = content
        };
        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode(); // Asegurarse de que la respuesta sea exitosa
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
        Assert.Contains("Usuario actualizado exitosamente", responseBody, StringComparison.OrdinalIgnoreCase);
    }
    [Fact]
    public static async Task Update_User_Name_Fail()
    {
        var userId = "00000000-0000-0000-0000-000000000000"; // ID Invalido
        var requestBody = new
        {
            actualizaciones = new
            {
                name = " " // N/A
            }
        };

        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Put, $"/api/usuarios/update_usuario/{userId}")
        {
            Content = content
        };
        var response = await client.SendAsync(request);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);
    }
    [Fact]
    public static async Task Save_User_Success()
    {
        var user = new //Tiene que tener datos que no estan en la base
        {
            email = "newuser@example.com",
            role = "CLIENT_ROLE",
            password = "SecurePassword123",
            imagen = "Test, esta no es una ruta",
            name = "TestName",
            lastname = "TestLastname",
            userName = "Test123"
        };

        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(user);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/usuarios/save_usuario", content);
        
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);

        Assert.Contains("Usuario registrado exitosamente", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public static async Task Save_User_Fail_Missing_Fields()
    {
        var user = new
        {
            email = "newuser@example.com",
            role = "CLIENT_ROLE",
            // Falta el campo 'password'
            imagen = "path/to/image.jpg",
            name = "Alesis",
            lastname = "Doe"
            // Falta el campo 'userName'
        };

        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(user);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/usuarios/save_usuario", content);
        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido a la falta de campos obligatorios.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);

        Assert.Contains("Faltan campos obligatorios", responseBody, StringComparison.OrdinalIgnoreCase);
    }
    [Fact]
    public static async Task Save_User_Fail_Email_Already_Registered()
    {
        var user = new
        {
            email = "Alesis@outlook.com", // Este correo debe estar registrado previamente en la base de datos
            role = "CLIENT_ROLE",
            password = "SecurePassword123",
            imagen = "path/to/image.jpg",
            name = "Alesis",
            lastname = "Doe",
            userName = "alesisd123"
        };

        HttpClient client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:8085");
        client.DefaultRequestHeaders.Add("accept", "application/json");
        var json = System.Text.Json.JsonSerializer.Serialize(user);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/usuarios/save_usuario", content);

        Assert.False(response.IsSuccessStatusCode, "Se esperaba que la solicitud fallara debido al correo ya registrado.");
        var responseBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseBody);

        Assert.Contains("El correo ya está registrado", responseBody, StringComparison.OrdinalIgnoreCase);
    }
}