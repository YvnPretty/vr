using UnityEngine;

[RequireComponent(typeof(MeshFilter), typeof(MeshRenderer))]
public class ProceduralARObject : MonoBehaviour
{
    void Start()
    {
        Mesh mesh = new Mesh();
        
        // Create a simple stylized diamond/crystal shape
        Vector3[] vertices = new Vector3[]
        {
            new Vector3(0, 1, 0),    // Top
            new Vector3(1, 0, 1),    // Middle ring
            new Vector3(-1, 0, 1),
            new Vector3(-1, 0, -1),
            new Vector3(1, 0, -1),
            new Vector3(0, -1, 0)    // Bottom
        };

        int[] triangles = new int[]
        {
            0, 1, 2,
            0, 2, 3,
            0, 3, 4,
            0, 4, 1,
            5, 2, 1,
            5, 3, 2,
            5, 4, 3,
            5, 1, 4
        };

        mesh.vertices = vertices;
        mesh.triangles = triangles;
        mesh.RecalculateNormals();

        GetComponent<MeshFilter>().mesh = mesh;
        
        // Add a nice material via code if not assigned
        Renderer renderer = GetComponent<MeshRenderer>();
        renderer.material = new Material(Shader.Find("Standard"));
        renderer.material.color = new Color(0.2f, 0.8f, 1f, 0.8f); // Cyan Glassy
        renderer.material.SetFloat("_Mode", 3); // Transparent
        renderer.material.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
        renderer.material.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
        renderer.material.SetInt("_ZWrite", 0);
        renderer.material.DisableKeyword("_ALPHATEST_ON");
        renderer.material.EnableKeyword("_ALPHABLEND_ON");
        renderer.material.DisableKeyword("_ALPHAPREMULTIPLY_ON");
        renderer.material.renderQueue = 3000;
    }

    void Update()
    {
        // Subtle floating animation
        transform.Rotate(Vector3.up, 30 * Time.deltaTime);
        transform.position += Vector3.up * Mathf.Sin(Time.time * 2f) * 0.001f;
    }
}
