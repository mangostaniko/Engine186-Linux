// store voxels in 3D texture using image load/store
layout(binding = 0, rgba16f) uniform image3D uVoxelDiffuseColor;

// model data for sampling at voxels
layout(location = 140) uniform vec2 uTexCoordsScale = vec2(1, 1);
layout(location = 110) uniform vec3 uDiffuseColor;
layout(location = 120) uniform sampler2D uDiffuseTexSampler;

// voxel grid dimensions
uniform int uGridSizeX;
uniform int uGridSizeY;
uniform int uGridSizeZ;

in VertexData
{
    vec3 faceNormal;
    vec2 texCoords;
} v_in;

flat in int axisOfTriangleProjection; // to restore 3D voxel data

// - After rasterization, gl_FragCoord in OpenGL is left handed NDC space.
// - gl_FragCoord.xy are the window space coordinates as given by glViewport
//   pixel_center_integer layout qualifier used for pixel centers at integer coords instead default half integer
//   so gl_FragCoord.xy are in [0, resolutionX - 1][0, resolutionY - 1]
// - gl_FragCoord.z stores the depth in [0,1] between near and far plane,
//   here depth is linear due to orthographic projection in geometry shader
layout(pixel_center_integer) in vec4 gl_FragCoord;

void main()
{
    ivec3 voxelCoord = ivec3(0);

    float depth = gl_FragCoord.z; // linear

    // After rasterization, OpenGL gives us voxel sample coordinates in a left handed NDC space (x,y,depth)
    // with projection direction stored in depth. first we need to map this to our original system (X,Y,Z)

    if (axisOfTriangleProjection == 0)
    {
        // projection was in direction X, thus left-handed NDC depth z stores our X
        // assume left hand fingers are NDC (x,y,depth)
        // then if we rotate depth to point to X instead of Z, then x points to -Z, y points to Y
        voxelCoord.x = int(uGridSizeX * depth);
        voxelCoord.y = int(gl_FragCoord.y);
        voxelCoord.z = uGridSizeZ-1 - int(gl_FragCoord.x);
    }
    else if (axisOfTriangleProjection == 1)
    {
        // projection was in direction Y, thus left-handed NDC depth z stores our Y
        // assume left hand fingers are NDC (x,y,depth)
        // then if we rotate depth to point to Y instead of Z, then x points to X, y points to -Z
        voxelCoord.x = int(gl_FragCoord.x);
        voxelCoord.y = int(uGridSizeY * depth);
        voxelCoord.z = uGridSizeZ-1 - int(gl_FragCoord.y);
    }
    else if (axisOfTriangleProjection == 2)
    {
        // projection was in direction Z, thus left-handed NDC (x,y,depth) corresponds to our left-handed (X,Y,Z)
        voxelCoord.x = int(gl_FragCoord.x);
        voxelCoord.y = int(gl_FragCoord.y);
        voxelCoord.z = int(uGridSizeZ * depth);
    }

    // we want a right-handed voxel volume coordinate system
    // so we flip, for example, Y and wrap around in the grid, i.e. Y -> maxY - Y
    //voxelCoord.y = uGridSizeY-1 - voxelCoord.y;

    // composite and store projected triangle fragments as voxel data
    // average values from all projected triangle fragments that coincide on the voxel
    // this requires atomic since fragments are processed in parallel
    // GL imageAtomicAdd only works for 32bit integer images though, so we use an emulation
    // TODO
    vec2 scaledTexCoords = uTexCoordsScale * v_in.texCoords;
    vec3 diffuseTexColor = texture(uDiffuseTexSampler, scaledTexCoords).rgb;
    imageStore(uVoxelDiffuseColor, voxelCoord, vec4(diffuseTexColor, 1.0));

}

// TODO this still only works on integer images
// 2012 Crassin, Green: Octree-Based Sparse Voxelization Using The GPU Hardware Rasterizer
// Listing 22.1.
// Emulation of imageAtomicAdd (which works on integer values) for float values using compare-and-swap.
// The idea is to loop on each write until there are no more conflicts and the texel value,
// with which we have computed the sum has not been changed by another thread.
// This is a lot slower than native atomicAdd but allows functionally correct behavior.
// imageAtomicCompSwap is in OpenGL specification since version 4.2.
// floatBitToUInt and uintBitsToFloat are in OpenGL specification since version 3.3.
void imageAtomicFloatAdd(layout(r32ui) coherent volatile uimage3D imgUI, ivec3 coords, float valueToAdd)
{
    uint newVal = floatBitToUInt(valueToAdd);
    uint prevVal = 0; // the knowledge we have about texel value at coords from last loop iteration
    uint currentVal; // current knowledge we have about texel value at coords

    // Loop as long as destination value gets changed by other threads
    // imageAtomicCompSwap compares texel to prevVal atomically
    // if equal stores newVal, else nothing happens. always returns original texel value.
    // texel value may be updated by other threads, but imageAtomicCompSwap checks and assigns as an atomic operation
    // if checked value equals our previously known texel value prevVal, it means our newVal is also up-to-date
    // if checked value has changed, it means our newVal is also outdated and we must loop on
    while ((currentVal = imageAtomicCompSwap(imgUI, coords, prevVal, newVal) != prevVal)
    {
        prevVal = currentVal;
        newVal = floatBitsToUInt((uintBitsToFloat(currentVal) + valueToAdd));
    }
}
